export type ScreenConfig = {
  BaseResolution: string; // "1920x1080"
  ScaleMode: "Responsive";
  UIScaleStrategy: "MinAxis";
  SafeArea: boolean;
};

export type LayoutConfig = {
  UseScaleOnly: boolean;
  AllowOffset: string[];
  AnchorPointDefault: [number, number];
  NestingPolicy: "Flat";
  AutomaticSize: {
    Enabled: boolean;
    Axis: "X" | "Y" | "Both";
  };
  Constraints: {
    AspectRatio: "Auto" | number;
    SizeLimits: "Auto" | { Min?: number; Max?: number };
  };
};

export type SpacingConfig = {
  Grid: number;
  PaddingDefault: number;
  GapDefault: number;
  OuterMargin: number;
};

export type ColorConfig = {
  /** メニュー全体の後ろにある面。ゲーム世界が見えていればその色。 */
  Background: string;
  /** サイドバー（カテゴリ切り替えの帯）の面。 */
  Sidebar: string;
  /** 一覧が乗る中央の大きな面。 */
  Panel: string;
  /** Panel の上に重なる、ハイライトされていない通常の行やカードの面。 */
  Surface: string;
  /** 選択中の項目のハイライト色。状態を表す色で、主ボタンの色ではない。 */
  Selected: string;
  /** 基本の文字色。 */
  Text: string;
  AccentPositive: string;
  AccentGrowth: string;
};

export type TypographyConfig = {
  FontFamily: string;
  Header: { Size: number; Weight: string };
  Body: { Size: number; Weight: string };
  Button: { Size: number; Weight: string };
};

export type VisualConfig = {
  CornerRadius: {
    Mode: "Pill" | "Rounded" | "Square";
    Value: number;
  };
  Stroke: {
    Enabled: boolean;
    Thickness: number;
    Transparency: number;
  };
};

export type ComponentSidebar = {
  Width: string; // "18%"
  Items: string[];
};

export type ComponentSelectionList = {
  Scroll: {
    UseUIListLayout: boolean;
    UseUIPadding: boolean;
    AutomaticCanvasSize: "X" | "Y" | "Both";
  };
  AspectRatio: number;
  Gap: number;
};

export type ComponentDetailPanel = {
  CompareMode: "Arrow" | "Numeric" | "None";
  GrowthIndicator: boolean;
};

export type ComponentActionArea = {
  Buttons: string[];
  Layout: "Horizontal" | "Vertical";
};

export type ComponentIcon = {
  AspectRatio: number;
  SizeScale: number;
};

export type ComponentsConfig = {
  Sidebar: ComponentSidebar;
  SelectionList: ComponentSelectionList;
  DetailPanel: ComponentDetailPanel;
  ActionArea: ComponentActionArea;
  Icon: ComponentIcon;
};

export type InteractionConfig = {
  ButtonPress: {
    Scale: number;
    StartWithinMs: number;
  };
  ButtonStates: {
    Hover: { Scale: number };
    Press: { Scale: number };
    Disabled: { Transparency: number };
  };
  UpgradeFeedback: {
    Particle: boolean;
    Sound: boolean;
    CompleteWithin: number;
  };
};

export type RobloxRulesConfig = {
  ZIndex: {
    Modal: number;
    Panel: number;
    Base: number;
  };
  RemoteEventFlow: {
    UseRemoteEvent: boolean;
    ServerHandler: string;
  };
  PriceSource: {
    UseConfigModule: string;
    HardcodeForbidden: boolean;
  };
};

export type DSLBlueprint = {
  Screen: ScreenConfig;
  Layout: LayoutConfig;
  Spacing: SpacingConfig;
  Color: ColorConfig;
  Typography: TypographyConfig;
  Visual: VisualConfig;
  Components: ComponentsConfig;
  Interactions: InteractionConfig;
  RobloxRules: RobloxRulesConfig;
};

// 初期テンプレート（LLMが壊れた時のフォールバック）
export const DefaultDSL: DSLBlueprint = {
  Screen: {
    BaseResolution: "1920x1080",
    ScaleMode: "Responsive",
    UIScaleStrategy: "MinAxis",
    SafeArea: true,
  },
  Layout: {
    UseScaleOnly: true,
    AllowOffset: ["1px-border"],
    AnchorPointDefault: [0.5, 0.5],
    NestingPolicy: "Flat",
    AutomaticSize: { Enabled: true, Axis: "Y" },
    Constraints: { AspectRatio: "Auto", SizeLimits: "Auto" },
  },
  Spacing: {
    Grid: 8,
    PaddingDefault: 24,
    GapDefault: 16,
    OuterMargin: 48,
  },
  Color: {
    Background: "#000000-#1E1E3C",
    Sidebar: "#141221",
    Panel: "#1C1A29",
    Surface: "#242034",
    Selected: "#F6C453",
    Text: "#F2F0F7",
    AccentPositive: "#F6C453",
    AccentGrowth: "#A6FF4D",
  },
  Typography: {
    FontFamily: "Gotham",
    Header: { Size: 36, Weight: "Semibold" },
    Body: { Size: 18, Weight: "Regular" },
    Button: { Size: 22, Weight: "Bold" },
  },
  Visual: {
    CornerRadius: { Mode: "Pill", Value: 0.5 },
    Stroke: { Enabled: true, Thickness: 1, Transparency: 0.4 },
  },
  Components: {
    Sidebar: { Width: "18%", Items: ["CategoryButton", "SearchBar"] },
    SelectionList: {
      Scroll: {
        UseUIListLayout: true,
        UseUIPadding: true,
        AutomaticCanvasSize: "Y",
      },
      AspectRatio: 1.4,
      Gap: 16,
    },
    DetailPanel: { CompareMode: "Arrow", GrowthIndicator: true },
    ActionArea: { Buttons: ["BuyCoins", "BuyRobux"], Layout: "Horizontal" },
    Icon: { AspectRatio: 1, SizeScale: 0.08 },
  },
  Interactions: {
    ButtonPress: { Scale: 1.05, StartWithinMs: 80 },
    ButtonStates: {
      Hover: { Scale: 1.04 },
      Press: { Scale: 0.96 },
      Disabled: { Transparency: 0.5 },
    },
    UpgradeFeedback: { Particle: true, Sound: true, CompleteWithin: 0.2 },
  },
  RobloxRules: {
    ZIndex: { Modal: 10, Panel: 5, Base: 1 },
    RemoteEventFlow: {
      UseRemoteEvent: true,
      ServerHandler: "UpgradeManager",
    },
    PriceSource: {
      UseConfigModule: "UpgradeConfig",
      HardcodeForbidden: true,
    },
  },
};
