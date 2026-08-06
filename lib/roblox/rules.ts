
/**
 * Roblox UI Best Practices & Enforcement Rules
 * DSLと完全同期する辞書。
 * LLMが生成したUI仕様をRoblox実装に変換する際の基準として使う。
 */

export const RobloxUIRules = {
  Screen: {
    BaseResolution: "1920x1080",
    UIScale: {
      Strategy: "MinAxis",
      ScriptTemplate: "AutoScaleLocalScript", // 後で自動生成する
    },
    SafeArea: true,
  },

  Layout: {
    UseScaleOnly: true,
    AllowOffset: ["1px-border"],
    AnchorPointDefault: [0.5, 0.5],
    NestingPolicy: "Flat",
    AutomaticSize: {
      Enabled: true,
      Axis: "Y",
    },
    Constraints: {
      AspectRatio: "Auto",
      SizeLimits: "Auto",
    },
  },

  Spacing: {
    Grid: 8,
    PaddingDefault: 24,
    GapDefault: 16,
    OuterMargin: 48,
  },

  Color: {
    Background: "#000000-#1E1E3C",
    AccentPositive: "#F6C453",
    AccentGrowth: "#A6FF4D",
    Panel: "#1C1A29",
  },

  Typography: {
    FontFamily: "Gotham",
    Header: { Size: 36, Weight: "Semibold" },
    Body: { Size: 18, Weight: "Regular" },
    Button: { Size: 22, Weight: "Bold" },
  },

  Visual: {
    CornerRadius: {
      Mode: "Pill",
      Value: 0.5,
    },
    Stroke: {
      Enabled: true,
      Thickness: 1,
      Transparency: 0.4,
    },
  },

  Components: {
    Sidebar: {
      Width: "18%",
      Items: ["CategoryButton", "SearchBar"],
    },

    SelectionList: {
      Scroll: {
        UseUIListLayout: true,
        UseUIPadding: true,
        AutomaticCanvasSize: "Y",
      },
      AspectRatio: 1.4,
      Gap: 16,
    },

    DetailPanel: {
      CompareMode: "Arrow",
      GrowthIndicator: true,
    },

    ActionArea: {
      Buttons: ["BuyCoins", "BuyRobux"],
      Layout: "Horizontal",
    },

    Icon: {
      AspectRatio: 1,
      SizeScale: 0.08,
    },
  },

  Interactions: {
    ButtonPress: {
      Scale: 1.05,
      StartWithinMs: 80,
    },
    ButtonStates: {
      Hover: { Scale: 1.04 },
      Press: { Scale: 0.96 },
      Disabled: { Transparency: 0.5 },
    },
    UpgradeFeedback: {
      Particle: true,
      Sound: true,
      CompleteWithin: 0.2,
    },
  },

  RobloxRules: {
    ZIndex: {
      Modal: 10,
      Panel: 5,
      Base: 1,
    },
    RemoteEventFlow: {
      UseRemoteEvent: true,
      ServerHandler: "UpgradeManager",
    },
    PriceSource: {
      UseConfigModule: "UpgradeConfig",
      HardcodeForbidden: true,
    },
  },
} as const;
