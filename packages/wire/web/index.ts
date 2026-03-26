import Alpine from "alpinejs";
import { FiveMClientAdapter } from "./adapters/fivem";
import { HttpClientAdapter } from "./adapters/http";
import { SocketClientAdapter } from "./adapters/socket";
import { Kirewire } from "./kirewire";
import "./directives/click";
import "./directives/model";
import "./directives/poll";
import "./directives/loading";
import "./directives/dirty";
import "./directives/ignore";
import "./directives/init";
import "./directives/show";
import "./directives/offline";
import "./directives/intersect";
import "./directives/collection";
import "./directives/file";
import "./features/file-upload";
import "./features/wire-broadcast";
import "./features/game-canvas";
import "./features/navigate";
import "./adapters/http";

//@ts-expect-error ignore
window.Alpine = Alpine;
(Kirewire as any).HttpClientAdapter = HttpClientAdapter;
(Kirewire as any).SocketClientAdapter = SocketClientAdapter;
(Kirewire as any).FiveMClientAdapter = FiveMClientAdapter;

export { FiveMClientAdapter } from "./adapters/fivem";
export { HttpClientAdapter } from "./adapters/http";
export { SocketClientAdapter } from "./adapters/socket";
export { Kirewire } from "./kirewire";
export { bus } from "./utils/message-bus";
