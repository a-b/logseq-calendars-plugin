export const logseq = {
  App: {
    showMsg: jest.fn(),
    getUserConfigs: jest.fn(),
    registerCommandPalette: jest.fn(),
    registerUIItem: jest.fn(),
    pushState: jest.fn()
  },
  Editor: {
    getCurrentPage: jest.fn(),
    createPage: jest.fn(),
    insertBlock: jest.fn(),
    getBlock: jest.fn(),
    removeBlock: jest.fn(),
    getPageBlocksTree: jest.fn()
  },
  settings: {
    template: "{Start} - {End}: {Title}",
    timeFormat: "12 hour time"
  },
  useSettingsSchema: jest.fn(),
  ready: jest.fn(),
  updateSettings: jest.fn(),
  provideModel: jest.fn()
};

export default logseq;
