import { Kirewire } from './kirewire';
import { HttpClientAdapter } from './adapters/http';
import './directives/click';
import './directives/model';
import './directives/poll';
import './directives/loading';
import './directives/dirty';
import './directives/ignore';
import './directives/init';
import './directives/offline';
import './features/file-upload';
import './adapters/http';

(Kirewire as any).HttpClientAdapter = HttpClientAdapter;

export { Kirewire } from './kirewire';
export { HttpClientAdapter } from './adapters/http';
export { bus } from './utils/message-bus';
