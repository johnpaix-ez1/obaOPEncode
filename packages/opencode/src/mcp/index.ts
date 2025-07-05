import { experimental_createMCPClient, type Tool } from "ai"
import { Experimental_StdioMCPTransport } from "ai/mcp-stdio"
import { App } from "../app/app"
import { Config } from "../config/config"
import { Log } from "../util/log"
import { NamedError } from "../util/error"
import { z } from "zod"
import { Session } from "../session"
import { Bus } from "../bus"

export namespace MCP {
  const log = Log.create({ service: "mcp" })

  export const Failed = NamedError.create(
    "MCPFailed",
    z.object({
      name: z.string(),
    }),
  )

  const state = App.state(
    "mcp",
    async () => {
      const cfg = await Config.get()
      const clients: {
        [name: string]: Awaited<ReturnType<typeof experimental_createMCPClient>>
      } = {}
      for (const [key, mcp] of Object.entries(cfg.mcp ?? {})) {
        if (mcp.enabled === false) {
          log.info("mcp server disabled", { key })
          continue
        }
        log.info("found", { key, type: mcp.type })
        if (mcp.type === "remote") {
          const client = await experimental_createMCPClient({
            name: key,
            transport: {
              type: "sse",
              url: mcp.url,
            },
          }).catch(() => {})
          if (!client) {
            Bus.publish(Session.Event.Error, {
              error: {
                name: "UnknownError",
                data: {
                  message: `MCP server ${key} failed to start`,
                },
              },
            })
            continue
          }
          clients[key] = client
        }

        if (mcp.type === "local") {
          const [cmd, ...args] = mcp.command
          const client = await experimental_createMCPClient({
            name: key,
            transport: new Experimental_StdioMCPTransport({
              stderr: "ignore",
              command: cmd,
              args,
              env: {
                ...process.env,
                ...(cmd === "opencode" ? { BUN_BE_BUN: "1" } : {}),
                ...mcp.environment,
              },
            }),
          }).catch(() => {})
          if (!client) {
            Bus.publish(Session.Event.Error, {
              error: {
                name: "UnknownError",
                data: {
                  message: `MCP server ${key} failed to start`,
                },
              },
            })
            continue
          }
          clients[key] = client
        }
      }

      return {
        clients,
      }
    },
    async (state) => {
      for (const client of Object.values(state.clients)) {
        client.close()
      }
    },
  )

  export async function clients() {
    return state().then((state) => state.clients)
  }

  export async function tools(providerID?: string) {
    const result: Record<string, Tool> = {}
    const clientEntries = Object.entries(await clients())
    
    for (const [clientName, client] of clientEntries) {
      try {
        const clientTools = await client.tools()
        
        for (const [toolName, tool] of Object.entries(clientTools)) {
          const toolKey = clientName + "_" + toolName
          
          if (providerID) {
            const transformedTool = await transformToolForProvider(tool, providerID)
            result[toolKey] = transformedTool
          } else {
            result[toolKey] = tool
          }
        }
      } catch (error: any) {
        log.error('Failed to get tools from MCP client', { clientName, error: error.message })
      }
    }
    
    return result
  }

  async function transformToolForProvider(tool: any, providerID: string): Promise<any> {
    if (!['openai', 'azure'].includes(providerID)) return tool
    
    try {
      const { Provider } = await import("../provider/provider")
      return Provider.transformMCPToolForProvider(tool, providerID)
    } catch (error: any) {
      log.warn('Could not transform MCP tool schema, using as-is', { 
        toolId: tool.id || 'unknown',
        providerID,
        error: error.message
      })
      return tool
    }
  }
}
