import { createMachine, assign } from "xstate"

export interface ImportWizardContext {
  brokerId?: string
  assetClass?: string
  fileMeta?: {
    name: string
    size: number
    type: string
  }
  rowsSample?: any[]
  detectedSchema?: {
    schemaId: string
    brokerGuess?: string
    assetGuess?: string
    confidence?: number
    headerMap?: Record<string, string>
    warnings?: string[]
  }
  mapping?: Record<string, string>
  validationReport?: {
    errors: number
    warnings: number
    duplicates: number
    rows: number
  }
  importJobId?: string
  progress?: number
  error?: string
}

export const importWizardMachine = createMachine<any, any, any, any, any, any, any, any, any, any, any>(
  {
    id: "importWizard",
    initial: "chooseBroker",
    context: {},
    states: {
      chooseBroker: {
        on: {
          NEXT: {
            guard: "hasBroker",
            target: "chooseAssetType"
          }
        }
      },
      chooseAssetType: {
        on: {
          PREV: "chooseBroker",
          NEXT: {
            guard: "hasAssetClass",
            target: "upload"
          }
        }
      },
      upload: {
        on: {
          PREV: "chooseAssetType",
          FILE_LOADED: {
            actions: "setFileMeta",
            target: "detecting"
          }
        }
      },
      detecting: {
        invoke: {
          src: async (ctx, evt) => {
            // Call backend /import/detect
            // Return {brokerGuess, assetGuess, schemaId, confidence, headerMap, warnings}
            return {}
          },
          onDone: {
            actions: "setDetectedSchema",
            target: "preview"
          },
          onError: {
            actions: "setError",
            target: "error"
          }
        },
        on: {
          CANCEL: "upload"
        }
      },
      preview: {
        on: {
          PREV: "upload",
          REMAP: "preview", // opens mapping drawer
          CONTINUE: "importing"
        }
      },
      importing: {
        invoke: {
          src: async (ctx, evt) => {
            // Call backend /import/start
            // Return import summary
            return {}
          },
          onDone: {
            actions: "setImportResult",
            target: "done"
          },
          onError: {
            actions: "setError",
            target: "error"
          }
        },
        on: {
          CANCEL: "preview"
        }
      },
      done: {
        on: {
          RESTART: {
            actions: "resetContext",
            target: "chooseBroker"
          }
        }
      },
      error: {
        on: {
          RESTART: {
            actions: "resetContext",
            target: "chooseBroker"
          }
        }
      }
    }
  },
  {
    actions: {
      setFileMeta: assign((ctx, evt) => ({ fileMeta: evt.fileMeta })),
      setDetectedSchema: assign((ctx, evt) => ({ detectedSchema: evt.data })),
      setError: assign((ctx, evt) => ({ error: evt.data?.message || "Unknown error" })),
      setImportResult: assign((ctx, evt) => ({ ...evt.data })),
      resetContext: assign((ctx, evt) => ({})),
    },
    guards: {
      hasBroker: (ctx: any) => !!ctx.brokerId,
      hasAssetClass: (ctx: any) => !!ctx.assetClass,
    }
  }
)
