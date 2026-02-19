export * from "./component";
export * from "./page-component";
export * from "./core/broadcast";
export * from "./core/plugin";
export * from "./core/rule";
export * from "./core/file";
export * from "./types";

import { wirePlugin } from "./core/plugin";
export { wirePlugin };
export default wirePlugin;
