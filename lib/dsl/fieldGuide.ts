/**
 * DSL の各フィールドが「画像のどこを指しているか」をモデルに伝える定義文。
 *
 * テンプレート（DefaultDSL）は形は示せるが、意味までは伝えられない。
 * 実際、Color.Panel の定義が無いために、同じ画像から
 * 「メインパネルのクリーム色」と「サイドバーの茶色」が交互に返る不安定さが出ていた。
 *
 * UIは面が入れ子になっているため、どの層をどの名前で呼ぶかを明示しないと
 * モデルは毎回別の割り当てを選ぶ。ここはその曖昧さを潰すための文章。
 */
export const FIELD_GUIDE = `Field meanings. Follow these exactly when deciding which part of the image each value comes from.

A game menu is made of nested surfaces. Assign them in this order:

- Color.Background
  The surface BEHIND the whole menu window. If the menu floats over the game
  world, use the dominant color of that world or backdrop. This is the
  outermost layer, never the menu itself.
  Use "#RRGGBB-#RRGGBB" only if it is clearly a gradient. Otherwise one "#RRGGBB".

- Color.Sidebar
  The strip that holds the category buttons, usually along the left edge.
  Take the color of the strip itself, not of the buttons on it.
  If the sidebar has no distinct color, reuse the Panel color.

- Color.Panel
  The main content surface where the item list or main information sits.
  This is the large area in the middle of the menu.
  It is NOT the sidebar, and NOT the backdrop behind the window.

- Color.Surface
  The fill of a NORMAL, UNSELECTED list row or card sitting ON TOP of the Panel.
  Look at a row that is not currently highlighted. If several rows look the same
  and only one differs, the majority color is Surface.
  If unselected rows have no distinct fill, reuse the Panel color.
  Never use the highlighted row's color here.

- Color.Selected
  The highlight fill of the item that is currently selected, either in the
  sidebar or in the list. This is a state color.
  It is NOT the primary button color, and NOT the normal row color.
  If nothing in the image looks selected, reuse the AccentPositive color.

- Color.Text
  The main body text color, taken from the item names in the list.
  Not the heading color and not the button label color.

- Color.AccentPositive
  The fill color of the primary action button (buy, upgrade, confirm).
  If several buttons exist, choose the visually strongest one.

- Color.AccentGrowth
  The color used for increases, gains, or "next level" values.
  Often green. If the image has no such indicator, keep the template value.

- Typography.Header.Size / Body.Size / Button.Size
  Font sizes in pixels, assuming a 1920x1080 screen. Estimate from the image
  proportions. Header is the screen title, Body is list row text, Button is
  the primary action button label.

- Spacing.PaddingDefault
  Inner padding of the main panel, in pixels at 1920x1080.
- Spacing.GapDefault
  Vertical gap between list rows, in pixels at 1920x1080.
- Spacing.OuterMargin
  Distance between the menu window edge and the screen edge, in pixels.

- Visual.CornerRadius
  Mode "Pill" for fully rounded ends, "Rounded" for normal rounded corners,
  "Square" for sharp corners.
  When Mode is "Rounded", Value is a PIXEL radius at 1920x1080 (for example 16).
  Judge from the main panel, not from the most rounded element.

- Visual.Stroke
  The border drawn around panels. Thickness in pixels, Transparency 0 means
  fully opaque and 1 means invisible.

- Components.Sidebar.Width
  Sidebar width as a percentage of the full screen width, like "20%".
- Components.Sidebar.Items
  The category labels actually visible in the sidebar, in order, as they appear.
- Components.ActionArea.Buttons
  The labels of the action buttons actually visible in the image.
- Components.SelectionList.AspectRatio
  Width divided by height of a single list row.

If a value cannot be determined from the image, keep the template's value
rather than inventing one.`;
