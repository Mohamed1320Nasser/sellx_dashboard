// IPC Channel Constants
export const IPC_CHANNELS = {
  // Config channels
  CONFIG_GET: 'config:get',
  CONFIG_SET: 'config:set',
  CONFIG_GET_BACKEND_URL: 'config:get-backend-url',
  CONFIG_SET_BACKEND_URL: 'config:set-backend-url',
  CONFIG_TEST_BACKEND: 'config:test-backend',
  CONFIG_RESET: 'config:reset',
  CONFIG_EXPORT: 'config:export',
  CONFIG_IMPORT: 'config:import',

  // Printer channels (if needed in the future)
  PRINTER_PRINT: 'printer:print',
  PRINTER_GET_STATUS: 'printer:get-status',
  PRINTER_GET_CONFIG: 'printer:get-config',
  PRINTER_SET_CONFIG: 'printer:set-config',

  // Scanner channels (if needed in the future)
  SCANNER_START: 'scanner:start',
  SCANNER_STOP: 'scanner:stop',
  SCANNER_GET_STATUS: 'scanner:get-status',
} as const;

export type IPCChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];
