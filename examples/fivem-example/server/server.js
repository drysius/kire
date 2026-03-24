var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
function __accessProp(key) {
  return this[key];
}
var __toESMCache_node;
var __toESMCache_esm;
var __toESM = (mod, isNodeMode, target) => {
  var canCache = mod != null && typeof mod === "object";
  if (canCache) {
    var cache = isNodeMode ? __toESMCache_node ??= new WeakMap : __toESMCache_esm ??= new WeakMap;
    var cached = cache.get(mod);
    if (cached)
      return cached;
  }
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: __accessProp.bind(mod, key),
        enumerable: true
      });
  if (canCache)
    cache.set(mod, to);
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __returnValue = (v) => v;
function __exportSetter(name, newValue) {
  this[name] = __returnValue.bind(null, newValue);
}
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: __exportSetter.bind(all, name)
    });
};
var __esm = (fn2, res) => () => (fn2 && (res = fn2(fn2 = 0)), res);

// node_modules/.bun/es-object-atoms@1.1.1/node_modules/es-object-atoms/index.js
var require_es_object_atoms = __commonJS((exports2, module2) => {
  module2.exports = Object;
});

// node_modules/.bun/es-errors@1.3.0/node_modules/es-errors/index.js
var require_es_errors = __commonJS((exports2, module2) => {
  module2.exports = Error;
});

// node_modules/.bun/es-errors@1.3.0/node_modules/es-errors/eval.js
var require_eval = __commonJS((exports2, module2) => {
  module2.exports = EvalError;
});

// node_modules/.bun/es-errors@1.3.0/node_modules/es-errors/range.js
var require_range = __commonJS((exports2, module2) => {
  module2.exports = RangeError;
});

// node_modules/.bun/es-errors@1.3.0/node_modules/es-errors/ref.js
var require_ref = __commonJS((exports2, module2) => {
  module2.exports = ReferenceError;
});

// node_modules/.bun/es-errors@1.3.0/node_modules/es-errors/syntax.js
var require_syntax = __commonJS((exports2, module2) => {
  module2.exports = SyntaxError;
});

// node_modules/.bun/es-errors@1.3.0/node_modules/es-errors/type.js
var require_type = __commonJS((exports2, module2) => {
  module2.exports = TypeError;
});

// node_modules/.bun/es-errors@1.3.0/node_modules/es-errors/uri.js
var require_uri = __commonJS((exports2, module2) => {
  module2.exports = URIError;
});

// node_modules/.bun/math-intrinsics@1.1.0/node_modules/math-intrinsics/abs.js
var require_abs = __commonJS((exports2, module2) => {
  module2.exports = Math.abs;
});

// node_modules/.bun/math-intrinsics@1.1.0/node_modules/math-intrinsics/floor.js
var require_floor = __commonJS((exports2, module2) => {
  module2.exports = Math.floor;
});

// node_modules/.bun/math-intrinsics@1.1.0/node_modules/math-intrinsics/max.js
var require_max = __commonJS((exports2, module2) => {
  module2.exports = Math.max;
});

// node_modules/.bun/math-intrinsics@1.1.0/node_modules/math-intrinsics/min.js
var require_min = __commonJS((exports2, module2) => {
  module2.exports = Math.min;
});

// node_modules/.bun/math-intrinsics@1.1.0/node_modules/math-intrinsics/pow.js
var require_pow = __commonJS((exports2, module2) => {
  module2.exports = Math.pow;
});

// node_modules/.bun/math-intrinsics@1.1.0/node_modules/math-intrinsics/round.js
var require_round = __commonJS((exports2, module2) => {
  module2.exports = Math.round;
});

// node_modules/.bun/math-intrinsics@1.1.0/node_modules/math-intrinsics/isNaN.js
var require_isNaN = __commonJS((exports2, module2) => {
  module2.exports = Number.isNaN || function isNaN2(a) {
    return a !== a;
  };
});

// node_modules/.bun/math-intrinsics@1.1.0/node_modules/math-intrinsics/sign.js
var require_sign = __commonJS((exports2, module2) => {
  var $isNaN = require_isNaN();
  module2.exports = function sign(number) {
    if ($isNaN(number) || number === 0) {
      return number;
    }
    return number < 0 ? -1 : 1;
  };
});

// node_modules/.bun/gopd@1.2.0/node_modules/gopd/gOPD.js
var require_gOPD = __commonJS((exports2, module2) => {
  module2.exports = Object.getOwnPropertyDescriptor;
});

// node_modules/.bun/gopd@1.2.0/node_modules/gopd/index.js
var require_gopd = __commonJS((exports2, module2) => {
  var $gOPD = require_gOPD();
  if ($gOPD) {
    try {
      $gOPD([], "length");
    } catch (e) {
      $gOPD = null;
    }
  }
  module2.exports = $gOPD;
});

// node_modules/.bun/es-define-property@1.0.1/node_modules/es-define-property/index.js
var require_es_define_property = __commonJS((exports2, module2) => {
  var $defineProperty = Object.defineProperty || false;
  if ($defineProperty) {
    try {
      $defineProperty({}, "a", { value: 1 });
    } catch (e) {
      $defineProperty = false;
    }
  }
  module2.exports = $defineProperty;
});

// node_modules/.bun/has-symbols@1.1.0/node_modules/has-symbols/shams.js
var require_shams = __commonJS((exports2, module2) => {
  module2.exports = function hasSymbols() {
    if (typeof Symbol !== "function" || typeof Object.getOwnPropertySymbols !== "function") {
      return false;
    }
    if (typeof Symbol.iterator === "symbol") {
      return true;
    }
    var obj = {};
    var sym = Symbol("test");
    var symObj = Object(sym);
    if (typeof sym === "string") {
      return false;
    }
    if (Object.prototype.toString.call(sym) !== "[object Symbol]") {
      return false;
    }
    if (Object.prototype.toString.call(symObj) !== "[object Symbol]") {
      return false;
    }
    var symVal = 42;
    obj[sym] = symVal;
    for (var _ in obj) {
      return false;
    }
    if (typeof Object.keys === "function" && Object.keys(obj).length !== 0) {
      return false;
    }
    if (typeof Object.getOwnPropertyNames === "function" && Object.getOwnPropertyNames(obj).length !== 0) {
      return false;
    }
    var syms = Object.getOwnPropertySymbols(obj);
    if (syms.length !== 1 || syms[0] !== sym) {
      return false;
    }
    if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) {
      return false;
    }
    if (typeof Object.getOwnPropertyDescriptor === "function") {
      var descriptor = Object.getOwnPropertyDescriptor(obj, sym);
      if (descriptor.value !== symVal || descriptor.enumerable !== true) {
        return false;
      }
    }
    return true;
  };
});

// node_modules/.bun/has-symbols@1.1.0/node_modules/has-symbols/index.js
var require_has_symbols = __commonJS((exports2, module2) => {
  var origSymbol = typeof Symbol !== "undefined" && Symbol;
  var hasSymbolSham = require_shams();
  module2.exports = function hasNativeSymbols() {
    if (typeof origSymbol !== "function") {
      return false;
    }
    if (typeof Symbol !== "function") {
      return false;
    }
    if (typeof origSymbol("foo") !== "symbol") {
      return false;
    }
    if (typeof Symbol("bar") !== "symbol") {
      return false;
    }
    return hasSymbolSham();
  };
});

// node_modules/.bun/get-proto@1.0.1/node_modules/get-proto/Reflect.getPrototypeOf.js
var require_Reflect_getPrototypeOf = __commonJS((exports2, module2) => {
  module2.exports = typeof Reflect !== "undefined" && Reflect.getPrototypeOf || null;
});

// node_modules/.bun/get-proto@1.0.1/node_modules/get-proto/Object.getPrototypeOf.js
var require_Object_getPrototypeOf = __commonJS((exports2, module2) => {
  var $Object = require_es_object_atoms();
  module2.exports = $Object.getPrototypeOf || null;
});

// node_modules/.bun/function-bind@1.1.2/node_modules/function-bind/implementation.js
var require_implementation = __commonJS((exports2, module2) => {
  var ERROR_MESSAGE = "Function.prototype.bind called on incompatible ";
  var toStr = Object.prototype.toString;
  var max = Math.max;
  var funcType = "[object Function]";
  var concatty = function concatty2(a, b) {
    var arr = [];
    for (var i = 0;i < a.length; i += 1) {
      arr[i] = a[i];
    }
    for (var j = 0;j < b.length; j += 1) {
      arr[j + a.length] = b[j];
    }
    return arr;
  };
  var slicy = function slicy2(arrLike, offset) {
    var arr = [];
    for (var i = offset || 0, j = 0;i < arrLike.length; i += 1, j += 1) {
      arr[j] = arrLike[i];
    }
    return arr;
  };
  var joiny = function(arr, joiner) {
    var str = "";
    for (var i = 0;i < arr.length; i += 1) {
      str += arr[i];
      if (i + 1 < arr.length) {
        str += joiner;
      }
    }
    return str;
  };
  module2.exports = function bind(that) {
    var target = this;
    if (typeof target !== "function" || toStr.apply(target) !== funcType) {
      throw new TypeError(ERROR_MESSAGE + target);
    }
    var args2 = slicy(arguments, 1);
    var bound;
    var binder = function() {
      if (this instanceof bound) {
        var result = target.apply(this, concatty(args2, arguments));
        if (Object(result) === result) {
          return result;
        }
        return this;
      }
      return target.apply(that, concatty(args2, arguments));
    };
    var boundLength = max(0, target.length - args2.length);
    var boundArgs = [];
    for (var i = 0;i < boundLength; i++) {
      boundArgs[i] = "$" + i;
    }
    bound = Function("binder", "return function (" + joiny(boundArgs, ",") + "){ return binder.apply(this,arguments); }")(binder);
    if (target.prototype) {
      var Empty = function Empty2() {};
      Empty.prototype = target.prototype;
      bound.prototype = new Empty;
      Empty.prototype = null;
    }
    return bound;
  };
});

// node_modules/.bun/function-bind@1.1.2/node_modules/function-bind/index.js
var require_function_bind = __commonJS((exports2, module2) => {
  var implementation = require_implementation();
  module2.exports = Function.prototype.bind || implementation;
});

// node_modules/.bun/call-bind-apply-helpers@1.0.2/node_modules/call-bind-apply-helpers/functionCall.js
var require_functionCall = __commonJS((exports2, module2) => {
  module2.exports = Function.prototype.call;
});

// node_modules/.bun/call-bind-apply-helpers@1.0.2/node_modules/call-bind-apply-helpers/functionApply.js
var require_functionApply = __commonJS((exports2, module2) => {
  module2.exports = Function.prototype.apply;
});

// node_modules/.bun/call-bind-apply-helpers@1.0.2/node_modules/call-bind-apply-helpers/reflectApply.js
var require_reflectApply = __commonJS((exports2, module2) => {
  module2.exports = typeof Reflect !== "undefined" && Reflect && Reflect.apply;
});

// node_modules/.bun/call-bind-apply-helpers@1.0.2/node_modules/call-bind-apply-helpers/actualApply.js
var require_actualApply = __commonJS((exports2, module2) => {
  var bind = require_function_bind();
  var $apply = require_functionApply();
  var $call = require_functionCall();
  var $reflectApply = require_reflectApply();
  module2.exports = $reflectApply || bind.call($call, $apply);
});

// node_modules/.bun/call-bind-apply-helpers@1.0.2/node_modules/call-bind-apply-helpers/index.js
var require_call_bind_apply_helpers = __commonJS((exports2, module2) => {
  var bind = require_function_bind();
  var $TypeError = require_type();
  var $call = require_functionCall();
  var $actualApply = require_actualApply();
  module2.exports = function callBindBasic(args2) {
    if (args2.length < 1 || typeof args2[0] !== "function") {
      throw new $TypeError("a function is required");
    }
    return $actualApply(bind, $call, args2);
  };
});

// node_modules/.bun/dunder-proto@1.0.1/node_modules/dunder-proto/get.js
var require_get = __commonJS((exports2, module2) => {
  var callBind = require_call_bind_apply_helpers();
  var gOPD = require_gopd();
  var hasProtoAccessor;
  try {
    hasProtoAccessor = [].__proto__ === Array.prototype;
  } catch (e) {
    if (!e || typeof e !== "object" || !("code" in e) || e.code !== "ERR_PROTO_ACCESS") {
      throw e;
    }
  }
  var desc = !!hasProtoAccessor && gOPD && gOPD(Object.prototype, "__proto__");
  var $Object = Object;
  var $getPrototypeOf = $Object.getPrototypeOf;
  module2.exports = desc && typeof desc.get === "function" ? callBind([desc.get]) : typeof $getPrototypeOf === "function" ? function getDunder(value) {
    return $getPrototypeOf(value == null ? value : $Object(value));
  } : false;
});

// node_modules/.bun/get-proto@1.0.1/node_modules/get-proto/index.js
var require_get_proto = __commonJS((exports2, module2) => {
  var reflectGetProto = require_Reflect_getPrototypeOf();
  var originalGetProto = require_Object_getPrototypeOf();
  var getDunderProto = require_get();
  module2.exports = reflectGetProto ? function getProto(O) {
    return reflectGetProto(O);
  } : originalGetProto ? function getProto(O) {
    if (!O || typeof O !== "object" && typeof O !== "function") {
      throw new TypeError("getProto: not an object");
    }
    return originalGetProto(O);
  } : getDunderProto ? function getProto(O) {
    return getDunderProto(O);
  } : null;
});

// node_modules/.bun/hasown@2.0.2/node_modules/hasown/index.js
var require_hasown = __commonJS((exports2, module2) => {
  var call = Function.prototype.call;
  var $hasOwn = Object.prototype.hasOwnProperty;
  var bind = require_function_bind();
  module2.exports = bind.call(call, $hasOwn);
});

// node_modules/.bun/get-intrinsic@1.3.0/node_modules/get-intrinsic/index.js
var require_get_intrinsic = __commonJS((exports2, module2) => {
  var undefined2;
  var $Object = require_es_object_atoms();
  var $Error = require_es_errors();
  var $EvalError = require_eval();
  var $RangeError = require_range();
  var $ReferenceError = require_ref();
  var $SyntaxError = require_syntax();
  var $TypeError = require_type();
  var $URIError = require_uri();
  var abs = require_abs();
  var floor = require_floor();
  var max = require_max();
  var min = require_min();
  var pow = require_pow();
  var round = require_round();
  var sign = require_sign();
  var $Function = Function;
  var getEvalledConstructor = function(expressionSyntax) {
    try {
      return $Function('"use strict"; return (' + expressionSyntax + ").constructor;")();
    } catch (e) {}
  };
  var $gOPD = require_gopd();
  var $defineProperty = require_es_define_property();
  var throwTypeError = function() {
    throw new $TypeError;
  };
  var ThrowTypeError = $gOPD ? function() {
    try {
      arguments.callee;
      return throwTypeError;
    } catch (calleeThrows) {
      try {
        return $gOPD(arguments, "callee").get;
      } catch (gOPDthrows) {
        return throwTypeError;
      }
    }
  }() : throwTypeError;
  var hasSymbols = require_has_symbols()();
  var getProto = require_get_proto();
  var $ObjectGPO = require_Object_getPrototypeOf();
  var $ReflectGPO = require_Reflect_getPrototypeOf();
  var $apply = require_functionApply();
  var $call = require_functionCall();
  var needsEval = {};
  var TypedArray = typeof Uint8Array === "undefined" || !getProto ? undefined2 : getProto(Uint8Array);
  var INTRINSICS = {
    __proto__: null,
    "%AggregateError%": typeof AggregateError === "undefined" ? undefined2 : AggregateError,
    "%Array%": Array,
    "%ArrayBuffer%": typeof ArrayBuffer === "undefined" ? undefined2 : ArrayBuffer,
    "%ArrayIteratorPrototype%": hasSymbols && getProto ? getProto([][Symbol.iterator]()) : undefined2,
    "%AsyncFromSyncIteratorPrototype%": undefined2,
    "%AsyncFunction%": needsEval,
    "%AsyncGenerator%": needsEval,
    "%AsyncGeneratorFunction%": needsEval,
    "%AsyncIteratorPrototype%": needsEval,
    "%Atomics%": typeof Atomics === "undefined" ? undefined2 : Atomics,
    "%BigInt%": typeof BigInt === "undefined" ? undefined2 : BigInt,
    "%BigInt64Array%": typeof BigInt64Array === "undefined" ? undefined2 : BigInt64Array,
    "%BigUint64Array%": typeof BigUint64Array === "undefined" ? undefined2 : BigUint64Array,
    "%Boolean%": Boolean,
    "%DataView%": typeof DataView === "undefined" ? undefined2 : DataView,
    "%Date%": Date,
    "%decodeURI%": decodeURI,
    "%decodeURIComponent%": decodeURIComponent,
    "%encodeURI%": encodeURI,
    "%encodeURIComponent%": encodeURIComponent,
    "%Error%": $Error,
    "%eval%": eval,
    "%EvalError%": $EvalError,
    "%Float16Array%": typeof Float16Array === "undefined" ? undefined2 : Float16Array,
    "%Float32Array%": typeof Float32Array === "undefined" ? undefined2 : Float32Array,
    "%Float64Array%": typeof Float64Array === "undefined" ? undefined2 : Float64Array,
    "%FinalizationRegistry%": typeof FinalizationRegistry === "undefined" ? undefined2 : FinalizationRegistry,
    "%Function%": $Function,
    "%GeneratorFunction%": needsEval,
    "%Int8Array%": typeof Int8Array === "undefined" ? undefined2 : Int8Array,
    "%Int16Array%": typeof Int16Array === "undefined" ? undefined2 : Int16Array,
    "%Int32Array%": typeof Int32Array === "undefined" ? undefined2 : Int32Array,
    "%isFinite%": isFinite,
    "%isNaN%": isNaN,
    "%IteratorPrototype%": hasSymbols && getProto ? getProto(getProto([][Symbol.iterator]())) : undefined2,
    "%JSON%": typeof JSON === "object" ? JSON : undefined2,
    "%Map%": typeof Map === "undefined" ? undefined2 : Map,
    "%MapIteratorPrototype%": typeof Map === "undefined" || !hasSymbols || !getProto ? undefined2 : getProto(new Map()[Symbol.iterator]()),
    "%Math%": Math,
    "%Number%": Number,
    "%Object%": $Object,
    "%Object.getOwnPropertyDescriptor%": $gOPD,
    "%parseFloat%": parseFloat,
    "%parseInt%": parseInt,
    "%Promise%": typeof Promise === "undefined" ? undefined2 : Promise,
    "%Proxy%": typeof Proxy === "undefined" ? undefined2 : Proxy,
    "%RangeError%": $RangeError,
    "%ReferenceError%": $ReferenceError,
    "%Reflect%": typeof Reflect === "undefined" ? undefined2 : Reflect,
    "%RegExp%": RegExp,
    "%Set%": typeof Set === "undefined" ? undefined2 : Set,
    "%SetIteratorPrototype%": typeof Set === "undefined" || !hasSymbols || !getProto ? undefined2 : getProto(new Set()[Symbol.iterator]()),
    "%SharedArrayBuffer%": typeof SharedArrayBuffer === "undefined" ? undefined2 : SharedArrayBuffer,
    "%String%": String,
    "%StringIteratorPrototype%": hasSymbols && getProto ? getProto(""[Symbol.iterator]()) : undefined2,
    "%Symbol%": hasSymbols ? Symbol : undefined2,
    "%SyntaxError%": $SyntaxError,
    "%ThrowTypeError%": ThrowTypeError,
    "%TypedArray%": TypedArray,
    "%TypeError%": $TypeError,
    "%Uint8Array%": typeof Uint8Array === "undefined" ? undefined2 : Uint8Array,
    "%Uint8ClampedArray%": typeof Uint8ClampedArray === "undefined" ? undefined2 : Uint8ClampedArray,
    "%Uint16Array%": typeof Uint16Array === "undefined" ? undefined2 : Uint16Array,
    "%Uint32Array%": typeof Uint32Array === "undefined" ? undefined2 : Uint32Array,
    "%URIError%": $URIError,
    "%WeakMap%": typeof WeakMap === "undefined" ? undefined2 : WeakMap,
    "%WeakRef%": typeof WeakRef === "undefined" ? undefined2 : WeakRef,
    "%WeakSet%": typeof WeakSet === "undefined" ? undefined2 : WeakSet,
    "%Function.prototype.call%": $call,
    "%Function.prototype.apply%": $apply,
    "%Object.defineProperty%": $defineProperty,
    "%Object.getPrototypeOf%": $ObjectGPO,
    "%Math.abs%": abs,
    "%Math.floor%": floor,
    "%Math.max%": max,
    "%Math.min%": min,
    "%Math.pow%": pow,
    "%Math.round%": round,
    "%Math.sign%": sign,
    "%Reflect.getPrototypeOf%": $ReflectGPO
  };
  if (getProto) {
    try {
      null.error;
    } catch (e) {
      errorProto = getProto(getProto(e));
      INTRINSICS["%Error.prototype%"] = errorProto;
    }
  }
  var errorProto;
  var doEval = function doEval2(name) {
    var value;
    if (name === "%AsyncFunction%") {
      value = getEvalledConstructor("async function () {}");
    } else if (name === "%GeneratorFunction%") {
      value = getEvalledConstructor("function* () {}");
    } else if (name === "%AsyncGeneratorFunction%") {
      value = getEvalledConstructor("async function* () {}");
    } else if (name === "%AsyncGenerator%") {
      var fn2 = doEval2("%AsyncGeneratorFunction%");
      if (fn2) {
        value = fn2.prototype;
      }
    } else if (name === "%AsyncIteratorPrototype%") {
      var gen = doEval2("%AsyncGenerator%");
      if (gen && getProto) {
        value = getProto(gen.prototype);
      }
    }
    INTRINSICS[name] = value;
    return value;
  };
  var LEGACY_ALIASES = {
    __proto__: null,
    "%ArrayBufferPrototype%": ["ArrayBuffer", "prototype"],
    "%ArrayPrototype%": ["Array", "prototype"],
    "%ArrayProto_entries%": ["Array", "prototype", "entries"],
    "%ArrayProto_forEach%": ["Array", "prototype", "forEach"],
    "%ArrayProto_keys%": ["Array", "prototype", "keys"],
    "%ArrayProto_values%": ["Array", "prototype", "values"],
    "%AsyncFunctionPrototype%": ["AsyncFunction", "prototype"],
    "%AsyncGenerator%": ["AsyncGeneratorFunction", "prototype"],
    "%AsyncGeneratorPrototype%": ["AsyncGeneratorFunction", "prototype", "prototype"],
    "%BooleanPrototype%": ["Boolean", "prototype"],
    "%DataViewPrototype%": ["DataView", "prototype"],
    "%DatePrototype%": ["Date", "prototype"],
    "%ErrorPrototype%": ["Error", "prototype"],
    "%EvalErrorPrototype%": ["EvalError", "prototype"],
    "%Float32ArrayPrototype%": ["Float32Array", "prototype"],
    "%Float64ArrayPrototype%": ["Float64Array", "prototype"],
    "%FunctionPrototype%": ["Function", "prototype"],
    "%Generator%": ["GeneratorFunction", "prototype"],
    "%GeneratorPrototype%": ["GeneratorFunction", "prototype", "prototype"],
    "%Int8ArrayPrototype%": ["Int8Array", "prototype"],
    "%Int16ArrayPrototype%": ["Int16Array", "prototype"],
    "%Int32ArrayPrototype%": ["Int32Array", "prototype"],
    "%JSONParse%": ["JSON", "parse"],
    "%JSONStringify%": ["JSON", "stringify"],
    "%MapPrototype%": ["Map", "prototype"],
    "%NumberPrototype%": ["Number", "prototype"],
    "%ObjectPrototype%": ["Object", "prototype"],
    "%ObjProto_toString%": ["Object", "prototype", "toString"],
    "%ObjProto_valueOf%": ["Object", "prototype", "valueOf"],
    "%PromisePrototype%": ["Promise", "prototype"],
    "%PromiseProto_then%": ["Promise", "prototype", "then"],
    "%Promise_all%": ["Promise", "all"],
    "%Promise_reject%": ["Promise", "reject"],
    "%Promise_resolve%": ["Promise", "resolve"],
    "%RangeErrorPrototype%": ["RangeError", "prototype"],
    "%ReferenceErrorPrototype%": ["ReferenceError", "prototype"],
    "%RegExpPrototype%": ["RegExp", "prototype"],
    "%SetPrototype%": ["Set", "prototype"],
    "%SharedArrayBufferPrototype%": ["SharedArrayBuffer", "prototype"],
    "%StringPrototype%": ["String", "prototype"],
    "%SymbolPrototype%": ["Symbol", "prototype"],
    "%SyntaxErrorPrototype%": ["SyntaxError", "prototype"],
    "%TypedArrayPrototype%": ["TypedArray", "prototype"],
    "%TypeErrorPrototype%": ["TypeError", "prototype"],
    "%Uint8ArrayPrototype%": ["Uint8Array", "prototype"],
    "%Uint8ClampedArrayPrototype%": ["Uint8ClampedArray", "prototype"],
    "%Uint16ArrayPrototype%": ["Uint16Array", "prototype"],
    "%Uint32ArrayPrototype%": ["Uint32Array", "prototype"],
    "%URIErrorPrototype%": ["URIError", "prototype"],
    "%WeakMapPrototype%": ["WeakMap", "prototype"],
    "%WeakSetPrototype%": ["WeakSet", "prototype"]
  };
  var bind = require_function_bind();
  var hasOwn = require_hasown();
  var $concat = bind.call($call, Array.prototype.concat);
  var $spliceApply = bind.call($apply, Array.prototype.splice);
  var $replace = bind.call($call, String.prototype.replace);
  var $strSlice = bind.call($call, String.prototype.slice);
  var $exec = bind.call($call, RegExp.prototype.exec);
  var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
  var reEscapeChar = /\\(\\)?/g;
  var stringToPath = function stringToPath2(string) {
    var first = $strSlice(string, 0, 1);
    var last = $strSlice(string, -1);
    if (first === "%" && last !== "%") {
      throw new $SyntaxError("invalid intrinsic syntax, expected closing `%`");
    } else if (last === "%" && first !== "%") {
      throw new $SyntaxError("invalid intrinsic syntax, expected opening `%`");
    }
    var result = [];
    $replace(string, rePropName, function(match, number, quote, subString) {
      result[result.length] = quote ? $replace(subString, reEscapeChar, "$1") : number || match;
    });
    return result;
  };
  var getBaseIntrinsic = function getBaseIntrinsic2(name, allowMissing) {
    var intrinsicName = name;
    var alias;
    if (hasOwn(LEGACY_ALIASES, intrinsicName)) {
      alias = LEGACY_ALIASES[intrinsicName];
      intrinsicName = "%" + alias[0] + "%";
    }
    if (hasOwn(INTRINSICS, intrinsicName)) {
      var value = INTRINSICS[intrinsicName];
      if (value === needsEval) {
        value = doEval(intrinsicName);
      }
      if (typeof value === "undefined" && !allowMissing) {
        throw new $TypeError("intrinsic " + name + " exists, but is not available. Please file an issue!");
      }
      return {
        alias,
        name: intrinsicName,
        value
      };
    }
    throw new $SyntaxError("intrinsic " + name + " does not exist!");
  };
  module2.exports = function GetIntrinsic(name, allowMissing) {
    if (typeof name !== "string" || name.length === 0) {
      throw new $TypeError("intrinsic name must be a non-empty string");
    }
    if (arguments.length > 1 && typeof allowMissing !== "boolean") {
      throw new $TypeError('"allowMissing" argument must be a boolean');
    }
    if ($exec(/^%?[^%]*%?$/, name) === null) {
      throw new $SyntaxError("`%` may not be present anywhere but at the beginning and end of the intrinsic name");
    }
    var parts = stringToPath(name);
    var intrinsicBaseName = parts.length > 0 ? parts[0] : "";
    var intrinsic = getBaseIntrinsic("%" + intrinsicBaseName + "%", allowMissing);
    var intrinsicRealName = intrinsic.name;
    var value = intrinsic.value;
    var skipFurtherCaching = false;
    var alias = intrinsic.alias;
    if (alias) {
      intrinsicBaseName = alias[0];
      $spliceApply(parts, $concat([0, 1], alias));
    }
    for (var i = 1, isOwn = true;i < parts.length; i += 1) {
      var part = parts[i];
      var first = $strSlice(part, 0, 1);
      var last = $strSlice(part, -1);
      if ((first === '"' || first === "'" || first === "`" || (last === '"' || last === "'" || last === "`")) && first !== last) {
        throw new $SyntaxError("property names with quotes must have matching quotes");
      }
      if (part === "constructor" || !isOwn) {
        skipFurtherCaching = true;
      }
      intrinsicBaseName += "." + part;
      intrinsicRealName = "%" + intrinsicBaseName + "%";
      if (hasOwn(INTRINSICS, intrinsicRealName)) {
        value = INTRINSICS[intrinsicRealName];
      } else if (value != null) {
        if (!(part in value)) {
          if (!allowMissing) {
            throw new $TypeError("base intrinsic for " + name + " exists, but the property is not available.");
          }
          return;
        }
        if ($gOPD && i + 1 >= parts.length) {
          var desc = $gOPD(value, part);
          isOwn = !!desc;
          if (isOwn && "get" in desc && !("originalValue" in desc.get)) {
            value = desc.get;
          } else {
            value = value[part];
          }
        } else {
          isOwn = hasOwn(value, part);
          value = value[part];
        }
        if (isOwn && !skipFurtherCaching) {
          INTRINSICS[intrinsicRealName] = value;
        }
      }
    }
    return value;
  };
});

// node_modules/.bun/call-bound@1.0.4/node_modules/call-bound/index.js
var require_call_bound = __commonJS((exports2, module2) => {
  var GetIntrinsic = require_get_intrinsic();
  var callBindBasic = require_call_bind_apply_helpers();
  var $indexOf = callBindBasic([GetIntrinsic("%String.prototype.indexOf%")]);
  module2.exports = function callBoundIntrinsic(name, allowMissing) {
    var intrinsic = GetIntrinsic(name, !!allowMissing);
    if (typeof intrinsic === "function" && $indexOf(name, ".prototype.") > -1) {
      return callBindBasic([intrinsic]);
    }
    return intrinsic;
  };
});

// node_modules/.bun/has-tostringtag@1.0.2/node_modules/has-tostringtag/shams.js
var require_shams2 = __commonJS((exports2, module2) => {
  var hasSymbols = require_shams();
  module2.exports = function hasToStringTagShams() {
    return hasSymbols() && !!Symbol.toStringTag;
  };
});

// node_modules/.bun/is-regex@1.2.1/node_modules/is-regex/index.js
var require_is_regex = __commonJS((exports2, module2) => {
  var callBound = require_call_bound();
  var hasToStringTag = require_shams2()();
  var hasOwn = require_hasown();
  var gOPD = require_gopd();
  var fn2;
  if (hasToStringTag) {
    $exec = callBound("RegExp.prototype.exec");
    isRegexMarker = {};
    throwRegexMarker = function() {
      throw isRegexMarker;
    };
    badStringifier = {
      toString: throwRegexMarker,
      valueOf: throwRegexMarker
    };
    if (typeof Symbol.toPrimitive === "symbol") {
      badStringifier[Symbol.toPrimitive] = throwRegexMarker;
    }
    fn2 = function isRegex(value) {
      if (!value || typeof value !== "object") {
        return false;
      }
      var descriptor = gOPD(value, "lastIndex");
      var hasLastIndexDataProperty = descriptor && hasOwn(descriptor, "value");
      if (!hasLastIndexDataProperty) {
        return false;
      }
      try {
        $exec(value, badStringifier);
      } catch (e) {
        return e === isRegexMarker;
      }
    };
  } else {
    $toString = callBound("Object.prototype.toString");
    regexClass = "[object RegExp]";
    fn2 = function isRegex(value) {
      if (!value || typeof value !== "object" && typeof value !== "function") {
        return false;
      }
      return $toString(value) === regexClass;
    };
  }
  var $exec;
  var isRegexMarker;
  var throwRegexMarker;
  var badStringifier;
  var $toString;
  var regexClass;
  module2.exports = fn2;
});

// node_modules/.bun/safe-regex-test@1.1.0/node_modules/safe-regex-test/index.js
var require_safe_regex_test = __commonJS((exports2, module2) => {
  var callBound = require_call_bound();
  var isRegex = require_is_regex();
  var $exec = callBound("RegExp.prototype.exec");
  var $TypeError = require_type();
  module2.exports = function regexTester(regex) {
    if (!isRegex(regex)) {
      throw new $TypeError("`regex` must be a RegExp");
    }
    return function test(s) {
      return $exec(regex, s) !== null;
    };
  };
});

// node_modules/.bun/generator-function@2.0.1/node_modules/generator-function/index.js
var require_generator_function = __commonJS((exports2, module2) => {
  var cached = function* () {}.constructor;
  module2.exports = () => cached;
});

// node_modules/.bun/is-generator-function@1.1.2/node_modules/is-generator-function/index.js
var require_is_generator_function = __commonJS((exports2, module2) => {
  var callBound = require_call_bound();
  var safeRegexTest = require_safe_regex_test();
  var isFnRegex = safeRegexTest(/^\s*(?:function)?\*/);
  var hasToStringTag = require_shams2()();
  var getProto = require_get_proto();
  var toStr = callBound("Object.prototype.toString");
  var fnToStr = callBound("Function.prototype.toString");
  var getGeneratorFunction = require_generator_function();
  module2.exports = function isGeneratorFunction(fn2) {
    if (typeof fn2 !== "function") {
      return false;
    }
    if (isFnRegex(fnToStr(fn2))) {
      return true;
    }
    if (!hasToStringTag) {
      var str = toStr(fn2);
      return str === "[object GeneratorFunction]";
    }
    if (!getProto) {
      return false;
    }
    var GeneratorFunction = getGeneratorFunction();
    return GeneratorFunction && getProto(fn2) === GeneratorFunction.prototype;
  };
});

// node_modules/.bun/ms@2.1.3/node_modules/ms/index.js
var require_ms = __commonJS((exports2, module2) => {
  var s = 1000;
  var m = s * 60;
  var h = m * 60;
  var d = h * 24;
  var w = d * 7;
  var y = d * 365.25;
  module2.exports = function(val, options) {
    options = options || {};
    var type = typeof val;
    if (type === "string" && val.length > 0) {
      return parse(val);
    } else if (type === "number" && isFinite(val)) {
      return options.long ? fmtLong(val) : fmtShort(val);
    }
    throw new Error("val is not a non-empty string or a valid number. val=" + JSON.stringify(val));
  };
  function parse(str) {
    str = String(str);
    if (str.length > 100) {
      return;
    }
    var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(str);
    if (!match) {
      return;
    }
    var n = parseFloat(match[1]);
    var type = (match[2] || "ms").toLowerCase();
    switch (type) {
      case "years":
      case "year":
      case "yrs":
      case "yr":
      case "y":
        return n * y;
      case "weeks":
      case "week":
      case "w":
        return n * w;
      case "days":
      case "day":
      case "d":
        return n * d;
      case "hours":
      case "hour":
      case "hrs":
      case "hr":
      case "h":
        return n * h;
      case "minutes":
      case "minute":
      case "mins":
      case "min":
      case "m":
        return n * m;
      case "seconds":
      case "second":
      case "secs":
      case "sec":
      case "s":
        return n * s;
      case "milliseconds":
      case "millisecond":
      case "msecs":
      case "msec":
      case "ms":
        return n;
      default:
        return;
    }
  }
  function fmtShort(ms) {
    var msAbs = Math.abs(ms);
    if (msAbs >= d) {
      return Math.round(ms / d) + "d";
    }
    if (msAbs >= h) {
      return Math.round(ms / h) + "h";
    }
    if (msAbs >= m) {
      return Math.round(ms / m) + "m";
    }
    if (msAbs >= s) {
      return Math.round(ms / s) + "s";
    }
    return ms + "ms";
  }
  function fmtLong(ms) {
    var msAbs = Math.abs(ms);
    if (msAbs >= d) {
      return plural(ms, msAbs, d, "day");
    }
    if (msAbs >= h) {
      return plural(ms, msAbs, h, "hour");
    }
    if (msAbs >= m) {
      return plural(ms, msAbs, m, "minute");
    }
    if (msAbs >= s) {
      return plural(ms, msAbs, s, "second");
    }
    return ms + " ms";
  }
  function plural(ms, msAbs, n, name) {
    var isPlural = msAbs >= n * 1.5;
    return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
  }
});

// node_modules/.bun/debug@4.4.3/node_modules/debug/src/common.js
var require_common = __commonJS((exports2, module2) => {
  function setup(env) {
    createDebug.debug = createDebug;
    createDebug.default = createDebug;
    createDebug.coerce = coerce;
    createDebug.disable = disable;
    createDebug.enable = enable;
    createDebug.enabled = enabled;
    createDebug.humanize = require_ms();
    createDebug.destroy = destroy;
    Object.keys(env).forEach((key) => {
      createDebug[key] = env[key];
    });
    createDebug.names = [];
    createDebug.skips = [];
    createDebug.formatters = {};
    function selectColor(namespace) {
      let hash = 0;
      for (let i = 0;i < namespace.length; i++) {
        hash = (hash << 5) - hash + namespace.charCodeAt(i);
        hash |= 0;
      }
      return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
    }
    createDebug.selectColor = selectColor;
    function createDebug(namespace) {
      let prevTime;
      let enableOverride = null;
      let namespacesCache;
      let enabledCache;
      function debug(...args2) {
        if (!debug.enabled) {
          return;
        }
        const self = debug;
        const curr = Number(new Date);
        const ms = curr - (prevTime || curr);
        self.diff = ms;
        self.prev = prevTime;
        self.curr = curr;
        prevTime = curr;
        args2[0] = createDebug.coerce(args2[0]);
        if (typeof args2[0] !== "string") {
          args2.unshift("%O");
        }
        let index = 0;
        args2[0] = args2[0].replace(/%([a-zA-Z%])/g, (match, format) => {
          if (match === "%%") {
            return "%";
          }
          index++;
          const formatter = createDebug.formatters[format];
          if (typeof formatter === "function") {
            const val = args2[index];
            match = formatter.call(self, val);
            args2.splice(index, 1);
            index--;
          }
          return match;
        });
        createDebug.formatArgs.call(self, args2);
        const logFn = self.log || createDebug.log;
        logFn.apply(self, args2);
      }
      debug.namespace = namespace;
      debug.useColors = createDebug.useColors();
      debug.color = createDebug.selectColor(namespace);
      debug.extend = extend;
      debug.destroy = createDebug.destroy;
      Object.defineProperty(debug, "enabled", {
        enumerable: true,
        configurable: false,
        get: () => {
          if (enableOverride !== null) {
            return enableOverride;
          }
          if (namespacesCache !== createDebug.namespaces) {
            namespacesCache = createDebug.namespaces;
            enabledCache = createDebug.enabled(namespace);
          }
          return enabledCache;
        },
        set: (v) => {
          enableOverride = v;
        }
      });
      if (typeof createDebug.init === "function") {
        createDebug.init(debug);
      }
      return debug;
    }
    function extend(namespace, delimiter) {
      const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
      newDebug.log = this.log;
      return newDebug;
    }
    function enable(namespaces) {
      createDebug.save(namespaces);
      createDebug.namespaces = namespaces;
      createDebug.names = [];
      createDebug.skips = [];
      const split = (typeof namespaces === "string" ? namespaces : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
      for (const ns of split) {
        if (ns[0] === "-") {
          createDebug.skips.push(ns.slice(1));
        } else {
          createDebug.names.push(ns);
        }
      }
    }
    function matchesTemplate(search, template) {
      let searchIndex = 0;
      let templateIndex = 0;
      let starIndex = -1;
      let matchIndex = 0;
      while (searchIndex < search.length) {
        if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === "*")) {
          if (template[templateIndex] === "*") {
            starIndex = templateIndex;
            matchIndex = searchIndex;
            templateIndex++;
          } else {
            searchIndex++;
            templateIndex++;
          }
        } else if (starIndex !== -1) {
          templateIndex = starIndex + 1;
          matchIndex++;
          searchIndex = matchIndex;
        } else {
          return false;
        }
      }
      while (templateIndex < template.length && template[templateIndex] === "*") {
        templateIndex++;
      }
      return templateIndex === template.length;
    }
    function disable() {
      const namespaces = [
        ...createDebug.names,
        ...createDebug.skips.map((namespace) => "-" + namespace)
      ].join(",");
      createDebug.enable("");
      return namespaces;
    }
    function enabled(name) {
      for (const skip of createDebug.skips) {
        if (matchesTemplate(name, skip)) {
          return false;
        }
      }
      for (const ns of createDebug.names) {
        if (matchesTemplate(name, ns)) {
          return true;
        }
      }
      return false;
    }
    function coerce(val) {
      if (val instanceof Error) {
        return val.stack || val.message;
      }
      return val;
    }
    function destroy() {
      console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
    }
    createDebug.enable(createDebug.load());
    return createDebug;
  }
  module2.exports = setup;
});

// node_modules/.bun/debug@4.4.3/node_modules/debug/src/browser.js
var require_browser = __commonJS((exports2, module2) => {
  exports2.formatArgs = formatArgs;
  exports2.save = save;
  exports2.load = load;
  exports2.useColors = useColors;
  exports2.storage = localstorage();
  exports2.destroy = (() => {
    let warned = false;
    return () => {
      if (!warned) {
        warned = true;
        console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
      }
    };
  })();
  exports2.colors = [
    "#0000CC",
    "#0000FF",
    "#0033CC",
    "#0033FF",
    "#0066CC",
    "#0066FF",
    "#0099CC",
    "#0099FF",
    "#00CC00",
    "#00CC33",
    "#00CC66",
    "#00CC99",
    "#00CCCC",
    "#00CCFF",
    "#3300CC",
    "#3300FF",
    "#3333CC",
    "#3333FF",
    "#3366CC",
    "#3366FF",
    "#3399CC",
    "#3399FF",
    "#33CC00",
    "#33CC33",
    "#33CC66",
    "#33CC99",
    "#33CCCC",
    "#33CCFF",
    "#6600CC",
    "#6600FF",
    "#6633CC",
    "#6633FF",
    "#66CC00",
    "#66CC33",
    "#9900CC",
    "#9900FF",
    "#9933CC",
    "#9933FF",
    "#99CC00",
    "#99CC33",
    "#CC0000",
    "#CC0033",
    "#CC0066",
    "#CC0099",
    "#CC00CC",
    "#CC00FF",
    "#CC3300",
    "#CC3333",
    "#CC3366",
    "#CC3399",
    "#CC33CC",
    "#CC33FF",
    "#CC6600",
    "#CC6633",
    "#CC9900",
    "#CC9933",
    "#CCCC00",
    "#CCCC33",
    "#FF0000",
    "#FF0033",
    "#FF0066",
    "#FF0099",
    "#FF00CC",
    "#FF00FF",
    "#FF3300",
    "#FF3333",
    "#FF3366",
    "#FF3399",
    "#FF33CC",
    "#FF33FF",
    "#FF6600",
    "#FF6633",
    "#FF9900",
    "#FF9933",
    "#FFCC00",
    "#FFCC33"
  ];
  function useColors() {
    if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) {
      return true;
    }
    if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
      return false;
    }
    let m;
    return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || typeof navigator !== "undefined" && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31 || typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
  }
  function formatArgs(args2) {
    args2[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args2[0] + (this.useColors ? "%c " : " ") + "+" + module2.exports.humanize(this.diff);
    if (!this.useColors) {
      return;
    }
    const c = "color: " + this.color;
    args2.splice(1, 0, c, "color: inherit");
    let index = 0;
    let lastC = 0;
    args2[0].replace(/%[a-zA-Z%]/g, (match) => {
      if (match === "%%") {
        return;
      }
      index++;
      if (match === "%c") {
        lastC = index;
      }
    });
    args2.splice(lastC, 0, c);
  }
  exports2.log = console.debug || console.log || (() => {});
  function save(namespaces) {
    try {
      if (namespaces) {
        exports2.storage.setItem("debug", namespaces);
      } else {
        exports2.storage.removeItem("debug");
      }
    } catch (error) {}
  }
  function load() {
    let r;
    try {
      r = exports2.storage.getItem("debug") || exports2.storage.getItem("DEBUG");
    } catch (error) {}
    if (!r && typeof process !== "undefined" && "env" in process) {
      r = process.env.DEBUG;
    }
    return r;
  }
  function localstorage() {
    try {
      return localStorage;
    } catch (error) {}
  }
  module2.exports = require_common()(exports2);
  var { formatters } = module2.exports;
  formatters.j = function(v) {
    try {
      return JSON.stringify(v);
    } catch (error) {
      return "[UnexpectedJSONParseError]: " + error.message;
    }
  };
});

// node_modules/.bun/has-flag@4.0.0/node_modules/has-flag/index.js
var require_has_flag = __commonJS((exports2, module2) => {
  module2.exports = (flag, argv = process.argv) => {
    const prefix = flag.startsWith("-") ? "" : flag.length === 1 ? "-" : "--";
    const position = argv.indexOf(prefix + flag);
    const terminatorPosition = argv.indexOf("--");
    return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
  };
});

// node_modules/.bun/supports-color@7.2.0/node_modules/supports-color/index.js
var require_supports_color = __commonJS((exports2, module2) => {
  var os = require("os");
  var tty = require("tty");
  var hasFlag = require_has_flag();
  var { env } = process;
  var forceColor;
  if (hasFlag("no-color") || hasFlag("no-colors") || hasFlag("color=false") || hasFlag("color=never")) {
    forceColor = 0;
  } else if (hasFlag("color") || hasFlag("colors") || hasFlag("color=true") || hasFlag("color=always")) {
    forceColor = 1;
  }
  if ("FORCE_COLOR" in env) {
    if (env.FORCE_COLOR === "true") {
      forceColor = 1;
    } else if (env.FORCE_COLOR === "false") {
      forceColor = 0;
    } else {
      forceColor = env.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(env.FORCE_COLOR, 10), 3);
    }
  }
  function translateLevel(level) {
    if (level === 0) {
      return false;
    }
    return {
      level,
      hasBasic: true,
      has256: level >= 2,
      has16m: level >= 3
    };
  }
  function supportsColor(haveStream, streamIsTTY) {
    if (forceColor === 0) {
      return 0;
    }
    if (hasFlag("color=16m") || hasFlag("color=full") || hasFlag("color=truecolor")) {
      return 3;
    }
    if (hasFlag("color=256")) {
      return 2;
    }
    if (haveStream && !streamIsTTY && forceColor === undefined) {
      return 0;
    }
    const min = forceColor || 0;
    if (env.TERM === "dumb") {
      return min;
    }
    if (process.platform === "win32") {
      const osRelease = os.release().split(".");
      if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) {
        return Number(osRelease[2]) >= 14931 ? 3 : 2;
      }
      return 1;
    }
    if ("CI" in env) {
      if (["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI", "GITHUB_ACTIONS", "BUILDKITE"].some((sign) => (sign in env)) || env.CI_NAME === "codeship") {
        return 1;
      }
      return min;
    }
    if ("TEAMCITY_VERSION" in env) {
      return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
    }
    if (env.COLORTERM === "truecolor") {
      return 3;
    }
    if ("TERM_PROGRAM" in env) {
      const version = parseInt((env.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
      switch (env.TERM_PROGRAM) {
        case "iTerm.app":
          return version >= 3 ? 3 : 2;
        case "Apple_Terminal":
          return 2;
      }
    }
    if (/-256(color)?$/i.test(env.TERM)) {
      return 2;
    }
    if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
      return 1;
    }
    if ("COLORTERM" in env) {
      return 1;
    }
    return min;
  }
  function getSupportLevel(stream) {
    const level = supportsColor(stream, stream && stream.isTTY);
    return translateLevel(level);
  }
  module2.exports = {
    supportsColor: getSupportLevel,
    stdout: translateLevel(supportsColor(true, tty.isatty(1))),
    stderr: translateLevel(supportsColor(true, tty.isatty(2)))
  };
});

// node_modules/.bun/debug@4.4.3/node_modules/debug/src/node.js
var require_node = __commonJS((exports2, module2) => {
  var tty = require("tty");
  var util = require("util");
  exports2.init = init;
  exports2.log = log;
  exports2.formatArgs = formatArgs;
  exports2.save = save;
  exports2.load = load;
  exports2.useColors = useColors;
  exports2.destroy = util.deprecate(() => {}, "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
  exports2.colors = [6, 2, 3, 4, 5, 1];
  try {
    const supportsColor = require_supports_color();
    if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) {
      exports2.colors = [
        20,
        21,
        26,
        27,
        32,
        33,
        38,
        39,
        40,
        41,
        42,
        43,
        44,
        45,
        56,
        57,
        62,
        63,
        68,
        69,
        74,
        75,
        76,
        77,
        78,
        79,
        80,
        81,
        92,
        93,
        98,
        99,
        112,
        113,
        128,
        129,
        134,
        135,
        148,
        149,
        160,
        161,
        162,
        163,
        164,
        165,
        166,
        167,
        168,
        169,
        170,
        171,
        172,
        173,
        178,
        179,
        184,
        185,
        196,
        197,
        198,
        199,
        200,
        201,
        202,
        203,
        204,
        205,
        206,
        207,
        208,
        209,
        214,
        215,
        220,
        221
      ];
    }
  } catch (error) {}
  exports2.inspectOpts = Object.keys(process.env).filter((key) => {
    return /^debug_/i.test(key);
  }).reduce((obj, key) => {
    const prop = key.substring(6).toLowerCase().replace(/_([a-z])/g, (_, k) => {
      return k.toUpperCase();
    });
    let val = process.env[key];
    if (/^(yes|on|true|enabled)$/i.test(val)) {
      val = true;
    } else if (/^(no|off|false|disabled)$/i.test(val)) {
      val = false;
    } else if (val === "null") {
      val = null;
    } else {
      val = Number(val);
    }
    obj[prop] = val;
    return obj;
  }, {});
  function useColors() {
    return "colors" in exports2.inspectOpts ? Boolean(exports2.inspectOpts.colors) : tty.isatty(process.stderr.fd);
  }
  function formatArgs(args2) {
    const { namespace: name, useColors: useColors2 } = this;
    if (useColors2) {
      const c = this.color;
      const colorCode = "\x1B[3" + (c < 8 ? c : "8;5;" + c);
      const prefix = `  ${colorCode};1m${name} \x1B[0m`;
      args2[0] = prefix + args2[0].split(`
`).join(`
` + prefix);
      args2.push(colorCode + "m+" + module2.exports.humanize(this.diff) + "\x1B[0m");
    } else {
      args2[0] = getDate() + name + " " + args2[0];
    }
  }
  function getDate() {
    if (exports2.inspectOpts.hideDate) {
      return "";
    }
    return new Date().toISOString() + " ";
  }
  function log(...args2) {
    return process.stderr.write(util.formatWithOptions(exports2.inspectOpts, ...args2) + `
`);
  }
  function save(namespaces) {
    if (namespaces) {
      process.env.DEBUG = namespaces;
    } else {
      delete process.env.DEBUG;
    }
  }
  function load() {
    return process.env.DEBUG;
  }
  function init(debug) {
    debug.inspectOpts = {};
    const keys = Object.keys(exports2.inspectOpts);
    for (let i = 0;i < keys.length; i++) {
      debug.inspectOpts[keys[i]] = exports2.inspectOpts[keys[i]];
    }
  }
  module2.exports = require_common()(exports2);
  var { formatters } = module2.exports;
  formatters.o = function(v) {
    this.inspectOpts.colors = this.useColors;
    return util.inspect(v, this.inspectOpts).split(`
`).map((str) => str.trim()).join(" ");
  };
  formatters.O = function(v) {
    this.inspectOpts.colors = this.useColors;
    return util.inspect(v, this.inspectOpts);
  };
});

// node_modules/.bun/debug@4.4.3/node_modules/debug/src/index.js
var require_src = __commonJS((exports2, module2) => {
  if (typeof process === "undefined" || process.type === "renderer" || false || process.__nwjs) {
    module2.exports = require_browser();
  } else {
    module2.exports = require_node();
  }
});

// node_modules/.bun/ee-first@1.1.1/node_modules/ee-first/index.js
var require_ee_first = __commonJS((exports2, module2) => {
  /*!
   * ee-first
   * Copyright(c) 2014 Jonathan Ong
   * MIT Licensed
   */
  module2.exports = first;
  function first(stuff, done) {
    if (!Array.isArray(stuff))
      throw new TypeError("arg must be an array of [ee, events...] arrays");
    var cleanups = [];
    for (var i = 0;i < stuff.length; i++) {
      var arr = stuff[i];
      if (!Array.isArray(arr) || arr.length < 2)
        throw new TypeError("each array member must be [ee, events...]");
      var ee = arr[0];
      for (var j = 1;j < arr.length; j++) {
        var event = arr[j];
        var fn2 = listener(event, callback);
        ee.on(event, fn2);
        cleanups.push({
          ee,
          event,
          fn: fn2
        });
      }
    }
    function callback() {
      cleanup();
      done.apply(null, arguments);
    }
    function cleanup() {
      var x;
      for (var i2 = 0;i2 < cleanups.length; i2++) {
        x = cleanups[i2];
        x.ee.removeListener(x.event, x.fn);
      }
    }
    function thunk(fn3) {
      done = fn3;
    }
    thunk.cancel = cleanup;
    return thunk;
  }
  function listener(event, done) {
    return function onevent(arg1) {
      var args2 = new Array(arguments.length);
      var ee = this;
      var err = event === "error" ? arg1 : null;
      for (var i = 0;i < args2.length; i++) {
        args2[i] = arguments[i];
      }
      done(err, ee, event, args2);
    };
  }
});

// node_modules/.bun/on-finished@2.4.1/node_modules/on-finished/index.js
var require_on_finished = __commonJS((exports2, module2) => {
  /*!
   * on-finished
   * Copyright(c) 2013 Jonathan Ong
   * Copyright(c) 2014 Douglas Christopher Wilson
   * MIT Licensed
   */
  module2.exports = onFinished;
  module2.exports.isFinished = isFinished;
  var asyncHooks = tryRequireAsyncHooks();
  var first = require_ee_first();
  var defer = typeof setImmediate === "function" ? setImmediate : function(fn2) {
    process.nextTick(fn2.bind.apply(fn2, arguments));
  };
  function onFinished(msg, listener) {
    if (isFinished(msg) !== false) {
      defer(listener, null, msg);
      return msg;
    }
    attachListener(msg, wrap(listener));
    return msg;
  }
  function isFinished(msg) {
    var socket = msg.socket;
    if (typeof msg.finished === "boolean") {
      return Boolean(msg.finished || socket && !socket.writable);
    }
    if (typeof msg.complete === "boolean") {
      return Boolean(msg.upgrade || !socket || !socket.readable || msg.complete && !msg.readable);
    }
    return;
  }
  function attachFinishedListener(msg, callback) {
    var eeMsg;
    var eeSocket;
    var finished = false;
    function onFinish(error) {
      eeMsg.cancel();
      eeSocket.cancel();
      finished = true;
      callback(error);
    }
    eeMsg = eeSocket = first([[msg, "end", "finish"]], onFinish);
    function onSocket(socket) {
      msg.removeListener("socket", onSocket);
      if (finished)
        return;
      if (eeMsg !== eeSocket)
        return;
      eeSocket = first([[socket, "error", "close"]], onFinish);
    }
    if (msg.socket) {
      onSocket(msg.socket);
      return;
    }
    msg.on("socket", onSocket);
    if (msg.socket === undefined) {
      patchAssignSocket(msg, onSocket);
    }
  }
  function attachListener(msg, listener) {
    var attached = msg.__onFinished;
    if (!attached || !attached.queue) {
      attached = msg.__onFinished = createListener(msg);
      attachFinishedListener(msg, attached);
    }
    attached.queue.push(listener);
  }
  function createListener(msg) {
    function listener(err) {
      if (msg.__onFinished === listener)
        msg.__onFinished = null;
      if (!listener.queue)
        return;
      var queue = listener.queue;
      listener.queue = null;
      for (var i = 0;i < queue.length; i++) {
        queue[i](err, msg);
      }
    }
    listener.queue = [];
    return listener;
  }
  function patchAssignSocket(res, callback) {
    var assignSocket = res.assignSocket;
    if (typeof assignSocket !== "function")
      return;
    res.assignSocket = function _assignSocket(socket) {
      assignSocket.call(this, socket);
      callback(socket);
    };
  }
  function tryRequireAsyncHooks() {
    try {
      return require("async_hooks");
    } catch (e) {
      return {};
    }
  }
  function wrap(fn2) {
    var res;
    if (asyncHooks.AsyncResource) {
      res = new asyncHooks.AsyncResource(fn2.name || "bound-anonymous-fn");
    }
    if (!res || !res.runInAsyncScope) {
      return fn2;
    }
    return res.runInAsyncScope.bind(res, fn2, null);
  }
});

// node_modules/.bun/safe-buffer@5.2.1/node_modules/safe-buffer/index.js
var require_safe_buffer = __commonJS((exports2, module2) => {
  /*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
  var buffer = require("buffer");
  var Buffer2 = buffer.Buffer;
  function copyProps(src, dst) {
    for (var key in src) {
      dst[key] = src[key];
    }
  }
  if (Buffer2.from && Buffer2.alloc && Buffer2.allocUnsafe && Buffer2.allocUnsafeSlow) {
    module2.exports = buffer;
  } else {
    copyProps(buffer, exports2);
    exports2.Buffer = SafeBuffer;
  }
  function SafeBuffer(arg, encodingOrOffset, length) {
    return Buffer2(arg, encodingOrOffset, length);
  }
  SafeBuffer.prototype = Object.create(Buffer2.prototype);
  copyProps(Buffer2, SafeBuffer);
  SafeBuffer.from = function(arg, encodingOrOffset, length) {
    if (typeof arg === "number") {
      throw new TypeError("Argument must not be a number");
    }
    return Buffer2(arg, encodingOrOffset, length);
  };
  SafeBuffer.alloc = function(size, fill, encoding) {
    if (typeof size !== "number") {
      throw new TypeError("Argument must be a number");
    }
    var buf = Buffer2(size);
    if (fill !== undefined) {
      if (typeof encoding === "string") {
        buf.fill(fill, encoding);
      } else {
        buf.fill(fill);
      }
    } else {
      buf.fill(0);
    }
    return buf;
  };
  SafeBuffer.allocUnsafe = function(size) {
    if (typeof size !== "number") {
      throw new TypeError("Argument must be a number");
    }
    return Buffer2(size);
  };
  SafeBuffer.allocUnsafeSlow = function(size) {
    if (typeof size !== "number") {
      throw new TypeError("Argument must be a number");
    }
    return buffer.SlowBuffer(size);
  };
});

// node_modules/.bun/content-disposition@0.5.4/node_modules/content-disposition/index.js
var require_content_disposition = __commonJS((exports2, module2) => {
  /*!
   * content-disposition
   * Copyright(c) 2014-2017 Douglas Christopher Wilson
   * MIT Licensed
   */
  module2.exports = contentDisposition;
  module2.exports.parse = parse;
  var basename = require("path").basename;
  var Buffer2 = require_safe_buffer().Buffer;
  var ENCODE_URL_ATTR_CHAR_REGEXP = /[\x00-\x20"'()*,/:;<=>?@[\\\]{}\x7f]/g;
  var HEX_ESCAPE_REGEXP = /%[0-9A-Fa-f]{2}/;
  var HEX_ESCAPE_REPLACE_REGEXP = /%([0-9A-Fa-f]{2})/g;
  var NON_LATIN1_REGEXP = /[^\x20-\x7e\xa0-\xff]/g;
  var QESC_REGEXP = /\\([\u0000-\u007f])/g;
  var QUOTE_REGEXP = /([\\"])/g;
  var PARAM_REGEXP = /;[\x09\x20]*([!#$%&'*+.0-9A-Z^_`a-z|~-]+)[\x09\x20]*=[\x09\x20]*("(?:[\x20!\x23-\x5b\x5d-\x7e\x80-\xff]|\\[\x20-\x7e])*"|[!#$%&'*+.0-9A-Z^_`a-z|~-]+)[\x09\x20]*/g;
  var TEXT_REGEXP = /^[\x20-\x7e\x80-\xff]+$/;
  var TOKEN_REGEXP = /^[!#$%&'*+.0-9A-Z^_`a-z|~-]+$/;
  var EXT_VALUE_REGEXP = /^([A-Za-z0-9!#$%&+\-^_`{}~]+)'(?:[A-Za-z]{2,3}(?:-[A-Za-z]{3}){0,3}|[A-Za-z]{4,8}|)'((?:%[0-9A-Fa-f]{2}|[A-Za-z0-9!#$&+.^_`|~-])+)$/;
  var DISPOSITION_TYPE_REGEXP = /^([!#$%&'*+.0-9A-Z^_`a-z|~-]+)[\x09\x20]*(?:$|;)/;
  function contentDisposition(filename, options) {
    var opts = options || {};
    var type = opts.type || "attachment";
    var params = createparams(filename, opts.fallback);
    return format(new ContentDisposition(type, params));
  }
  function createparams(filename, fallback) {
    if (filename === undefined) {
      return;
    }
    var params = {};
    if (typeof filename !== "string") {
      throw new TypeError("filename must be a string");
    }
    if (fallback === undefined) {
      fallback = true;
    }
    if (typeof fallback !== "string" && typeof fallback !== "boolean") {
      throw new TypeError("fallback must be a string or boolean");
    }
    if (typeof fallback === "string" && NON_LATIN1_REGEXP.test(fallback)) {
      throw new TypeError("fallback must be ISO-8859-1 string");
    }
    var name = basename(filename);
    var isQuotedString = TEXT_REGEXP.test(name);
    var fallbackName = typeof fallback !== "string" ? fallback && getlatin1(name) : basename(fallback);
    var hasFallback = typeof fallbackName === "string" && fallbackName !== name;
    if (hasFallback || !isQuotedString || HEX_ESCAPE_REGEXP.test(name)) {
      params["filename*"] = name;
    }
    if (isQuotedString || hasFallback) {
      params.filename = hasFallback ? fallbackName : name;
    }
    return params;
  }
  function format(obj) {
    var parameters = obj.parameters;
    var type = obj.type;
    if (!type || typeof type !== "string" || !TOKEN_REGEXP.test(type)) {
      throw new TypeError("invalid type");
    }
    var string = String(type).toLowerCase();
    if (parameters && typeof parameters === "object") {
      var param;
      var params = Object.keys(parameters).sort();
      for (var i = 0;i < params.length; i++) {
        param = params[i];
        var val = param.substr(-1) === "*" ? ustring(parameters[param]) : qstring(parameters[param]);
        string += "; " + param + "=" + val;
      }
    }
    return string;
  }
  function decodefield(str) {
    var match = EXT_VALUE_REGEXP.exec(str);
    if (!match) {
      throw new TypeError("invalid extended field value");
    }
    var charset = match[1].toLowerCase();
    var encoded = match[2];
    var value;
    var binary = encoded.replace(HEX_ESCAPE_REPLACE_REGEXP, pdecode);
    switch (charset) {
      case "iso-8859-1":
        value = getlatin1(binary);
        break;
      case "utf-8":
        value = Buffer2.from(binary, "binary").toString("utf8");
        break;
      default:
        throw new TypeError("unsupported charset in extended field");
    }
    return value;
  }
  function getlatin1(val) {
    return String(val).replace(NON_LATIN1_REGEXP, "?");
  }
  function parse(string) {
    if (!string || typeof string !== "string") {
      throw new TypeError("argument string is required");
    }
    var match = DISPOSITION_TYPE_REGEXP.exec(string);
    if (!match) {
      throw new TypeError("invalid type format");
    }
    var index = match[0].length;
    var type = match[1].toLowerCase();
    var key;
    var names = [];
    var params = {};
    var value;
    index = PARAM_REGEXP.lastIndex = match[0].substr(-1) === ";" ? index - 1 : index;
    while (match = PARAM_REGEXP.exec(string)) {
      if (match.index !== index) {
        throw new TypeError("invalid parameter format");
      }
      index += match[0].length;
      key = match[1].toLowerCase();
      value = match[2];
      if (names.indexOf(key) !== -1) {
        throw new TypeError("invalid duplicate parameter");
      }
      names.push(key);
      if (key.indexOf("*") + 1 === key.length) {
        key = key.slice(0, -1);
        value = decodefield(value);
        params[key] = value;
        continue;
      }
      if (typeof params[key] === "string") {
        continue;
      }
      if (value[0] === '"') {
        value = value.substr(1, value.length - 2).replace(QESC_REGEXP, "$1");
      }
      params[key] = value;
    }
    if (index !== -1 && index !== string.length) {
      throw new TypeError("invalid parameter format");
    }
    return new ContentDisposition(type, params);
  }
  function pdecode(str, hex) {
    return String.fromCharCode(parseInt(hex, 16));
  }
  function pencode(char) {
    return "%" + String(char).charCodeAt(0).toString(16).toUpperCase();
  }
  function qstring(val) {
    var str = String(val);
    return '"' + str.replace(QUOTE_REGEXP, "\\$1") + '"';
  }
  function ustring(val) {
    var str = String(val);
    var encoded = encodeURIComponent(str).replace(ENCODE_URL_ATTR_CHAR_REGEXP, pencode);
    return "UTF-8''" + encoded;
  }
  function ContentDisposition(type, parameters) {
    this.type = type;
    this.parameters = parameters;
  }
});

// node_modules/.bun/mime-db@1.52.0/node_modules/mime-db/db.json
var require_db = __commonJS((exports2, module2) => {
  module2.exports = {
    "application/1d-interleaved-parityfec": {
      source: "iana"
    },
    "application/3gpdash-qoe-report+xml": {
      source: "iana",
      charset: "UTF-8",
      compressible: true
    },
    "application/3gpp-ims+xml": {
      source: "iana",
      compressible: true
    },
    "application/3gpphal+json": {
      source: "iana",
      compressible: true
    },
    "application/3gpphalforms+json": {
      source: "iana",
      compressible: true
    },
    "application/a2l": {
      source: "iana"
    },
    "application/ace+cbor": {
      source: "iana"
    },
    "application/activemessage": {
      source: "iana"
    },
    "application/activity+json": {
      source: "iana",
      compressible: true
    },
    "application/alto-costmap+json": {
      source: "iana",
      compressible: true
    },
    "application/alto-costmapfilter+json": {
      source: "iana",
      compressible: true
    },
    "application/alto-directory+json": {
      source: "iana",
      compressible: true
    },
    "application/alto-endpointcost+json": {
      source: "iana",
      compressible: true
    },
    "application/alto-endpointcostparams+json": {
      source: "iana",
      compressible: true
    },
    "application/alto-endpointprop+json": {
      source: "iana",
      compressible: true
    },
    "application/alto-endpointpropparams+json": {
      source: "iana",
      compressible: true
    },
    "application/alto-error+json": {
      source: "iana",
      compressible: true
    },
    "application/alto-networkmap+json": {
      source: "iana",
      compressible: true
    },
    "application/alto-networkmapfilter+json": {
      source: "iana",
      compressible: true
    },
    "application/alto-updatestreamcontrol+json": {
      source: "iana",
      compressible: true
    },
    "application/alto-updatestreamparams+json": {
      source: "iana",
      compressible: true
    },
    "application/aml": {
      source: "iana"
    },
    "application/andrew-inset": {
      source: "iana",
      extensions: ["ez"]
    },
    "application/applefile": {
      source: "iana"
    },
    "application/applixware": {
      source: "apache",
      extensions: ["aw"]
    },
    "application/at+jwt": {
      source: "iana"
    },
    "application/atf": {
      source: "iana"
    },
    "application/atfx": {
      source: "iana"
    },
    "application/atom+xml": {
      source: "iana",
      compressible: true,
      extensions: ["atom"]
    },
    "application/atomcat+xml": {
      source: "iana",
      compressible: true,
      extensions: ["atomcat"]
    },
    "application/atomdeleted+xml": {
      source: "iana",
      compressible: true,
      extensions: ["atomdeleted"]
    },
    "application/atomicmail": {
      source: "iana"
    },
    "application/atomsvc+xml": {
      source: "iana",
      compressible: true,
      extensions: ["atomsvc"]
    },
    "application/atsc-dwd+xml": {
      source: "iana",
      compressible: true,
      extensions: ["dwd"]
    },
    "application/atsc-dynamic-event-message": {
      source: "iana"
    },
    "application/atsc-held+xml": {
      source: "iana",
      compressible: true,
      extensions: ["held"]
    },
    "application/atsc-rdt+json": {
      source: "iana",
      compressible: true
    },
    "application/atsc-rsat+xml": {
      source: "iana",
      compressible: true,
      extensions: ["rsat"]
    },
    "application/atxml": {
      source: "iana"
    },
    "application/auth-policy+xml": {
      source: "iana",
      compressible: true
    },
    "application/bacnet-xdd+zip": {
      source: "iana",
      compressible: false
    },
    "application/batch-smtp": {
      source: "iana"
    },
    "application/bdoc": {
      compressible: false,
      extensions: ["bdoc"]
    },
    "application/beep+xml": {
      source: "iana",
      charset: "UTF-8",
      compressible: true
    },
    "application/calendar+json": {
      source: "iana",
      compressible: true
    },
    "application/calendar+xml": {
      source: "iana",
      compressible: true,
      extensions: ["xcs"]
    },
    "application/call-completion": {
      source: "iana"
    },
    "application/cals-1840": {
      source: "iana"
    },
    "application/captive+json": {
      source: "iana",
      compressible: true
    },
    "application/cbor": {
      source: "iana"
    },
    "application/cbor-seq": {
      source: "iana"
    },
    "application/cccex": {
      source: "iana"
    },
    "application/ccmp+xml": {
      source: "iana",
      compressible: true
    },
    "application/ccxml+xml": {
      source: "iana",
      compressible: true,
      extensions: ["ccxml"]
    },
    "application/cdfx+xml": {
      source: "iana",
      compressible: true,
      extensions: ["cdfx"]
    },
    "application/cdmi-capability": {
      source: "iana",
      extensions: ["cdmia"]
    },
    "application/cdmi-container": {
      source: "iana",
      extensions: ["cdmic"]
    },
    "application/cdmi-domain": {
      source: "iana",
      extensions: ["cdmid"]
    },
    "application/cdmi-object": {
      source: "iana",
      extensions: ["cdmio"]
    },
    "application/cdmi-queue": {
      source: "iana",
      extensions: ["cdmiq"]
    },
    "application/cdni": {
      source: "iana"
    },
    "application/cea": {
      source: "iana"
    },
    "application/cea-2018+xml": {
      source: "iana",
      compressible: true
    },
    "application/cellml+xml": {
      source: "iana",
      compressible: true
    },
    "application/cfw": {
      source: "iana"
    },
    "application/city+json": {
      source: "iana",
      compressible: true
    },
    "application/clr": {
      source: "iana"
    },
    "application/clue+xml": {
      source: "iana",
      compressible: true
    },
    "application/clue_info+xml": {
      source: "iana",
      compressible: true
    },
    "application/cms": {
      source: "iana"
    },
    "application/cnrp+xml": {
      source: "iana",
      compressible: true
    },
    "application/coap-group+json": {
      source: "iana",
      compressible: true
    },
    "application/coap-payload": {
      source: "iana"
    },
    "application/commonground": {
      source: "iana"
    },
    "application/conference-info+xml": {
      source: "iana",
      compressible: true
    },
    "application/cose": {
      source: "iana"
    },
    "application/cose-key": {
      source: "iana"
    },
    "application/cose-key-set": {
      source: "iana"
    },
    "application/cpl+xml": {
      source: "iana",
      compressible: true,
      extensions: ["cpl"]
    },
    "application/csrattrs": {
      source: "iana"
    },
    "application/csta+xml": {
      source: "iana",
      compressible: true
    },
    "application/cstadata+xml": {
      source: "iana",
      compressible: true
    },
    "application/csvm+json": {
      source: "iana",
      compressible: true
    },
    "application/cu-seeme": {
      source: "apache",
      extensions: ["cu"]
    },
    "application/cwt": {
      source: "iana"
    },
    "application/cybercash": {
      source: "iana"
    },
    "application/dart": {
      compressible: true
    },
    "application/dash+xml": {
      source: "iana",
      compressible: true,
      extensions: ["mpd"]
    },
    "application/dash-patch+xml": {
      source: "iana",
      compressible: true,
      extensions: ["mpp"]
    },
    "application/dashdelta": {
      source: "iana"
    },
    "application/davmount+xml": {
      source: "iana",
      compressible: true,
      extensions: ["davmount"]
    },
    "application/dca-rft": {
      source: "iana"
    },
    "application/dcd": {
      source: "iana"
    },
    "application/dec-dx": {
      source: "iana"
    },
    "application/dialog-info+xml": {
      source: "iana",
      compressible: true
    },
    "application/dicom": {
      source: "iana"
    },
    "application/dicom+json": {
      source: "iana",
      compressible: true
    },
    "application/dicom+xml": {
      source: "iana",
      compressible: true
    },
    "application/dii": {
      source: "iana"
    },
    "application/dit": {
      source: "iana"
    },
    "application/dns": {
      source: "iana"
    },
    "application/dns+json": {
      source: "iana",
      compressible: true
    },
    "application/dns-message": {
      source: "iana"
    },
    "application/docbook+xml": {
      source: "apache",
      compressible: true,
      extensions: ["dbk"]
    },
    "application/dots+cbor": {
      source: "iana"
    },
    "application/dskpp+xml": {
      source: "iana",
      compressible: true
    },
    "application/dssc+der": {
      source: "iana",
      extensions: ["dssc"]
    },
    "application/dssc+xml": {
      source: "iana",
      compressible: true,
      extensions: ["xdssc"]
    },
    "application/dvcs": {
      source: "iana"
    },
    "application/ecmascript": {
      source: "iana",
      compressible: true,
      extensions: ["es", "ecma"]
    },
    "application/edi-consent": {
      source: "iana"
    },
    "application/edi-x12": {
      source: "iana",
      compressible: false
    },
    "application/edifact": {
      source: "iana",
      compressible: false
    },
    "application/efi": {
      source: "iana"
    },
    "application/elm+json": {
      source: "iana",
      charset: "UTF-8",
      compressible: true
    },
    "application/elm+xml": {
      source: "iana",
      compressible: true
    },
    "application/emergencycalldata.cap+xml": {
      source: "iana",
      charset: "UTF-8",
      compressible: true
    },
    "application/emergencycalldata.comment+xml": {
      source: "iana",
      compressible: true
    },
    "application/emergencycalldata.control+xml": {
      source: "iana",
      compressible: true
    },
    "application/emergencycalldata.deviceinfo+xml": {
      source: "iana",
      compressible: true
    },
    "application/emergencycalldata.ecall.msd": {
      source: "iana"
    },
    "application/emergencycalldata.providerinfo+xml": {
      source: "iana",
      compressible: true
    },
    "application/emergencycalldata.serviceinfo+xml": {
      source: "iana",
      compressible: true
    },
    "application/emergencycalldata.subscriberinfo+xml": {
      source: "iana",
      compressible: true
    },
    "application/emergencycalldata.veds+xml": {
      source: "iana",
      compressible: true
    },
    "application/emma+xml": {
      source: "iana",
      compressible: true,
      extensions: ["emma"]
    },
    "application/emotionml+xml": {
      source: "iana",
      compressible: true,
      extensions: ["emotionml"]
    },
    "application/encaprtp": {
      source: "iana"
    },
    "application/epp+xml": {
      source: "iana",
      compressible: true
    },
    "application/epub+zip": {
      source: "iana",
      compressible: false,
      extensions: ["epub"]
    },
    "application/eshop": {
      source: "iana"
    },
    "application/exi": {
      source: "iana",
      extensions: ["exi"]
    },
    "application/expect-ct-report+json": {
      source: "iana",
      compressible: true
    },
    "application/express": {
      source: "iana",
      extensions: ["exp"]
    },
    "application/fastinfoset": {
      source: "iana"
    },
    "application/fastsoap": {
      source: "iana"
    },
    "application/fdt+xml": {
      source: "iana",
      compressible: true,
      extensions: ["fdt"]
    },
    "application/fhir+json": {
      source: "iana",
      charset: "UTF-8",
      compressible: true
    },
    "application/fhir+xml": {
      source: "iana",
      charset: "UTF-8",
      compressible: true
    },
    "application/fido.trusted-apps+json": {
      compressible: true
    },
    "application/fits": {
      source: "iana"
    },
    "application/flexfec": {
      source: "iana"
    },
    "application/font-sfnt": {
      source: "iana"
    },
    "application/font-tdpfr": {
      source: "iana",
      extensions: ["pfr"]
    },
    "application/font-woff": {
      source: "iana",
      compressible: false
    },
    "application/framework-attributes+xml": {
      source: "iana",
      compressible: true
    },
    "application/geo+json": {
      source: "iana",
      compressible: true,
      extensions: ["geojson"]
    },
    "application/geo+json-seq": {
      source: "iana"
    },
    "application/geopackage+sqlite3": {
      source: "iana"
    },
    "application/geoxacml+xml": {
      source: "iana",
      compressible: true
    },
    "application/gltf-buffer": {
      source: "iana"
    },
    "application/gml+xml": {
      source: "iana",
      compressible: true,
      extensions: ["gml"]
    },
    "application/gpx+xml": {
      source: "apache",
      compressible: true,
      extensions: ["gpx"]
    },
    "application/gxf": {
      source: "apache",
      extensions: ["gxf"]
    },
    "application/gzip": {
      source: "iana",
      compressible: false,
      extensions: ["gz"]
    },
    "application/h224": {
      source: "iana"
    },
    "application/held+xml": {
      source: "iana",
      compressible: true
    },
    "application/hjson": {
      extensions: ["hjson"]
    },
    "application/http": {
      source: "iana"
    },
    "application/hyperstudio": {
      source: "iana",
      extensions: ["stk"]
    },
    "application/ibe-key-request+xml": {
      source: "iana",
      compressible: true
    },
    "application/ibe-pkg-reply+xml": {
      source: "iana",
      compressible: true
    },
    "application/ibe-pp-data": {
      source: "iana"
    },
    "application/iges": {
      source: "iana"
    },
    "application/im-iscomposing+xml": {
      source: "iana",
      charset: "UTF-8",
      compressible: true
    },
    "application/index": {
      source: "iana"
    },
    "application/index.cmd": {
      source: "iana"
    },
    "application/index.obj": {
      source: "iana"
    },
    "application/index.response": {
      source: "iana"
    },
    "application/index.vnd": {
      source: "iana"
    },
    "application/inkml+xml": {
      source: "iana",
      compressible: true,
      extensions: ["ink", "inkml"]
    },
    "application/iotp": {
      source: "iana"
    },
    "application/ipfix": {
      source: "iana",
      extensions: ["ipfix"]
    },
    "application/ipp": {
      source: "iana"
    },
    "application/isup": {
      source: "iana"
    },
    "application/its+xml": {
      source: "iana",
      compressible: true,
      extensions: ["its"]
    },
    "application/java-archive": {
      source: "apache",
      compressible: false,
      extensions: ["jar", "war", "ear"]
    },
    "application/java-serialized-object": {
      source: "apache",
      compressible: false,
      extensions: ["ser"]
    },
    "application/java-vm": {
      source: "apache",
      compressible: false,
      extensions: ["class"]
    },
    "application/javascript": {
      source: "iana",
      charset: "UTF-8",
      compressible: true,
      extensions: ["js", "mjs"]
    },
    "application/jf2feed+json": {
      source: "iana",
      compressible: true
    },
    "application/jose": {
      source: "iana"
    },
    "application/jose+json": {
      source: "iana",
      compressible: true
    },
    "application/jrd+json": {
      source: "iana",
      compressible: true
    },
    "application/jscalendar+json": {
      source: "iana",
      compressible: true
    },
    "application/json": {
      source: "iana",
      charset: "UTF-8",
      compressible: true,
      extensions: ["json", "map"]
    },
    "application/json-patch+json": {
      source: "iana",
      compressible: true
    },
    "application/json-seq": {
      source: "iana"
    },
    "application/json5": {
      extensions: ["json5"]
    },
    "application/jsonml+json": {
      source: "apache",
      compressible: true,
      extensions: ["jsonml"]
    },
    "application/jwk+json": {
      source: "iana",
      compressible: true
    },
    "application/jwk-set+json": {
      source: "iana",
      compressible: true
    },
    "application/jwt": {
      source: "iana"
    },
    "application/kpml-request+xml": {
      source: "iana",
      compressible: true
    },
    "application/kpml-response+xml": {
      source: "iana",
      compressible: true
    },
    "application/ld+json": {
      source: "iana",
      compressible: true,
      extensions: ["jsonld"]
    },
    "application/lgr+xml": {
      source: "iana",
      compressible: true,
      extensions: ["lgr"]
    },
    "application/link-format": {
      source: "iana"
    },
    "application/load-control+xml": {
      source: "iana",
      compressible: true
    },
    "application/lost+xml": {
      source: "iana",
      compressible: true,
      extensions: ["lostxml"]
    },
    "application/lostsync+xml": {
      source: "iana",
      compressible: true
    },
    "application/lpf+zip": {
      source: "iana",
      compressible: false
    },
    "application/lxf": {
      source: "iana"
    },
    "application/mac-binhex40": {
      source: "iana",
      extensions: ["hqx"]
    },
    "application/mac-compactpro": {
      source: "apache",
      extensions: ["cpt"]
    },
    "application/macwriteii": {
      source: "iana"
    },
    "application/mads+xml": {
      source: "iana",
      compressible: true,
      extensions: ["mads"]
    },
    "application/manifest+json": {
      source: "iana",
      charset: "UTF-8",
      compressible: true,
      extensions: ["webmanifest"]
    },
    "application/marc": {
      source: "iana",
      extensions: ["mrc"]
    },
    "application/marcxml+xml": {
      source: "iana",
      compressible: true,
      extensions: ["mrcx"]
    },
    "application/mathematica": {
      source: "iana",
      extensions: ["ma", "nb", "mb"]
    },
    "application/mathml+xml": {
      source: "iana",
      compressible: true,
      extensions: ["mathml"]
    },
    "application/mathml-content+xml": {
      source: "iana",
      compressible: true
    },
    "application/mathml-presentation+xml": {
      source: "iana",
      compressible: true
    },
    "application/mbms-associated-procedure-description+xml": {
      source: "iana",
      compressible: true
    },
    "application/mbms-deregister+xml": {
      source: "iana",
      compressible: true
    },
    "application/mbms-envelope+xml": {
      source: "iana",
      compressible: true
    },
    "application/mbms-msk+xml": {
      source: "iana",
      compressible: true
    },
    "application/mbms-msk-response+xml": {
      source: "iana",
      compressible: true
    },
    "application/mbms-protection-description+xml": {
      source: "iana",
      compressible: true
    },
    "application/mbms-reception-report+xml": {
      source: "iana",
      compressible: true
    },
    "application/mbms-register+xml": {
      source: "iana",
      compressible: true
    },
    "application/mbms-register-response+xml": {
      source: "iana",
      compressible: true
    },
    "application/mbms-schedule+xml": {
      source: "iana",
      compressible: true
    },
    "application/mbms-user-service-description+xml": {
      source: "iana",
      compressible: true
    },
    "application/mbox": {
      source: "iana",
      extensions: ["mbox"]
    },
    "application/media-policy-dataset+xml": {
      source: "iana",
      compressible: true,
      extensions: ["mpf"]
    },
    "application/media_control+xml": {
      source: "iana",
      compressible: true
    },
    "application/mediaservercontrol+xml": {
      source: "iana",
      compressible: true,
      extensions: ["mscml"]
    },
    "application/merge-patch+json": {
      source: "iana",
      compressible: true
    },
    "application/metalink+xml": {
      source: "apache",
      compressible: true,
      extensions: ["metalink"]
    },
    "application/metalink4+xml": {
      source: "iana",
      compressible: true,
      extensions: ["meta4"]
    },
    "application/mets+xml": {
      source: "iana",
      compressible: true,
      extensions: ["mets"]
    },
    "application/mf4": {
      source: "iana"
    },
    "application/mikey": {
      source: "iana"
    },
    "application/mipc": {
      source: "iana"
    },
    "application/missing-blocks+cbor-seq": {
      source: "iana"
    },
    "application/mmt-aei+xml": {
      source: "iana",
      compressible: true,
      extensions: ["maei"]
    },
    "application/mmt-usd+xml": {
      source: "iana",
      compressible: true,
      extensions: ["musd"]
    },
    "application/mods+xml": {
      source: "iana",
      compressible: true,
      extensions: ["mods"]
    },
    "application/moss-keys": {
      source: "iana"
    },
    "application/moss-signature": {
      source: "iana"
    },
    "application/mosskey-data": {
      source: "iana"
    },
    "application/mosskey-request": {
      source: "iana"
    },
    "application/mp21": {
      source: "iana",
      extensions: ["m21", "mp21"]
    },
    "application/mp4": {
      source: "iana",
      extensions: ["mp4s", "m4p"]
    },
    "application/mpeg4-generic": {
      source: "iana"
    },
    "application/mpeg4-iod": {
      source: "iana"
    },
    "application/mpeg4-iod-xmt": {
      source: "iana"
    },
    "application/mrb-consumer+xml": {
      source: "iana",
      compressible: true
    },
    "application/mrb-publish+xml": {
      source: "iana",
      compressible: true
    },
    "application/msc-ivr+xml": {
      source: "iana",
      charset: "UTF-8",
      compressible: true
    },
    "application/msc-mixer+xml": {
      source: "iana",
      charset: "UTF-8",
      compressible: true
    },
    "application/msword": {
      source: "iana",
      compressible: false,
      extensions: ["doc", "dot"]
    },
    "application/mud+json": {
      source: "iana",
      compressible: true
    },
    "application/multipart-core": {
      source: "iana"
    },
    "application/mxf": {
      source: "iana",
      extensions: ["mxf"]
    },
    "application/n-quads": {
      source: "iana",
      extensions: ["nq"]
    },
    "application/n-triples": {
      source: "iana",
      extensions: ["nt"]
    },
    "application/nasdata": {
      source: "iana"
    },
    "application/news-checkgroups": {
      source: "iana",
      charset: "US-ASCII"
    },
    "application/news-groupinfo": {
      source: "iana",
      charset: "US-ASCII"
    },
    "application/news-transmission": {
      source: "iana"
    },
    "application/nlsml+xml": {
      source: "iana",
      compressible: true
    },
    "application/node": {
      source: "iana",
      extensions: ["cjs"]
    },
    "application/nss": {
      source: "iana"
    },
    "application/oauth-authz-req+jwt": {
      source: "iana"
    },
    "application/oblivious-dns-message": {
      source: "iana"
    },
    "application/ocsp-request": {
      source: "iana"
    },
    "application/ocsp-response": {
      source: "iana"
    },
    "application/octet-stream": {
      source: "iana",
      compressible: false,
      extensions: ["bin", "dms", "lrf", "mar", "so", "dist", "distz", "pkg", "bpk", "dump", "elc", "deploy", "exe", "dll", "deb", "dmg", "iso", "img", "msi", "msp", "msm", "buffer"]
    },
    "application/oda": {
      source: "iana",
      extensions: ["oda"]
    },
    "application/odm+xml": {
      source: "iana",
      compressible: true
    },
    "application/odx": {
      source: "iana"
    },
    "application/oebps-package+xml": {
      source: "iana",
      compressible: true,
      extensions: ["opf"]
    },
    "application/ogg": {
      source: "iana",
      compressible: false,
      extensions: ["ogx"]
    },
    "application/omdoc+xml": {
      source: "apache",
      compressible: true,
      extensions: ["omdoc"]
    },
    "application/onenote": {
      source: "apache",
      extensions: ["onetoc", "onetoc2", "onetmp", "onepkg"]
    },
    "application/opc-nodeset+xml": {
      source: "iana",
      compressible: true
    },
    "application/oscore": {
      source: "iana"
    },
    "application/oxps": {
      source: "iana",
      extensions: ["oxps"]
    },
    "application/p21": {
      source: "iana"
    },
    "application/p21+zip": {
      source: "iana",
      compressible: false
    },
    "application/p2p-overlay+xml": {
      source: "iana",
      compressible: true,
      extensions: ["relo"]
    },
    "application/parityfec": {
      source: "iana"
    },
    "application/passport": {
      source: "iana"
    },
    "application/patch-ops-error+xml": {
      source: "iana",
      compressible: true,
      extensions: ["xer"]
    },
    "application/pdf": {
      source: "iana",
      compressible: false,
      extensions: ["pdf"]
    },
    "application/pdx": {
      source: "iana"
    },
    "application/pem-certificate-chain": {
      source: "iana"
    },
    "application/pgp-encrypted": {
      source: "iana",
      compressible: false,
      extensions: ["pgp"]
    },
    "application/pgp-keys": {
      source: "iana",
      extensions: ["asc"]
    },
    "application/pgp-signature": {
      source: "iana",
      extensions: ["asc", "sig"]
    },
    "application/pics-rules": {
      source: "apache",
      extensions: ["prf"]
    },
    "application/pidf+xml": {
      source: "iana",
      charset: "UTF-8",
      compressible: true
    },
    "application/pidf-diff+xml": {
      source: "iana",
      charset: "UTF-8",
      compressible: true
    },
    "application/pkcs10": {
      source: "iana",
      extensions: ["p10"]
    },
    "application/pkcs12": {
      source: "iana"
    },
    "application/pkcs7-mime": {
      source: "iana",
      extensions: ["p7m", "p7c"]
    },
    "application/pkcs7-signature": {
      source: "iana",
      extensions: ["p7s"]
    },
    "application/pkcs8": {
      source: "iana",
      extensions: ["p8"]
    },
    "application/pkcs8-encrypted": {
      source: "iana"
    },
    "application/pkix-attr-cert": {
      source: "iana",
      extensions: ["ac"]
    },
    "application/pkix-cert": {
      source: "iana",
      extensions: ["cer"]
    },
    "application/pkix-crl": {
      source: "iana",
      extensions: ["crl"]
    },
    "application/pkix-pkipath": {
      source: "iana",
      extensions: ["pkipath"]
    },
    "application/pkixcmp": {
      source: "iana",
      extensions: ["pki"]
    },
    "application/pls+xml": {
      source: "iana",
      compressible: true,
      extensions: ["pls"]
    },
    "application/poc-settings+xml": {
      source: "iana",
      charset: "UTF-8",
      compressible: true
    },
    "application/postscript": {
      source: "iana",
      compressible: true,
      extensions: ["ai", "eps", "ps"]
    },
    "application/ppsp-tracker+json": {
      source: "iana",
      compressible: true
    },
    "application/problem+json": {
      source: "iana",
      compressible: true
    },
    "application/problem+xml": {
      source: "iana",
      compressible: true
    },
    "application/provenance+xml": {
      source: "iana",
      compressible: true,
      extensions: ["provx"]
    },
    "application/prs.alvestrand.titrax-sheet": {
      source: "iana"
    },
    "application/prs.cww": {
      source: "iana",
      extensions: ["cww"]
    },
    "application/prs.cyn": {
      source: "iana",
      charset: "7-BIT"
    },
    "application/prs.hpub+zip": {
      source: "iana",
      compressible: false
    },
    "application/prs.nprend": {
      source: "iana"
    },
    "application/prs.plucker": {
      source: "iana"
    },
    "application/prs.rdf-xml-crypt": {
      source: "iana"
    },
    "application/prs.xsf+xml": {
      source: "iana",
      compressible: true
    },
    "application/pskc+xml": {
      source: "iana",
      compressible: true,
      extensions: ["pskcxml"]
    },
    "application/pvd+json": {
      source: "iana",
      compressible: true
    },
    "application/qsig": {
      source: "iana"
    },
    "application/raml+yaml": {
      compressible: true,
      extensions: ["raml"]
    },
    "application/raptorfec": {
      source: "iana"
    },
    "application/rdap+json": {
      source: "iana",
      compressible: true
    },
    "application/rdf+xml": {
      source: "iana",
      compressible: true,
      extensions: ["rdf", "owl"]
    },
    "application/reginfo+xml": {
      source: "iana",
      compressible: true,
      extensions: ["rif"]
    },
    "application/relax-ng-compact-syntax": {
      source: "iana",
      extensions: ["rnc"]
    },
    "application/remote-printing": {
      source: "iana"
    },
    "application/reputon+json": {
      source: "iana",
      compressible: true
    },
    "application/resource-lists+xml": {
      source: "iana",
      compressible: true,
      extensions: ["rl"]
    },
    "application/resource-lists-diff+xml": {
      source: "iana",
      compressible: true,
      extensions: ["rld"]
    },
    "application/rfc+xml": {
      source: "iana",
      compressible: true
    },
    "application/riscos": {
      source: "iana"
    },
    "application/rlmi+xml": {
      source: "iana",
      compressible: true
    },
    "application/rls-services+xml": {
      source: "iana",
      compressible: true,
      extensions: ["rs"]
    },
    "application/route-apd+xml": {
      source: "iana",
      compressible: true,
      extensions: ["rapd"]
    },
    "application/route-s-tsid+xml": {
      source: "iana",
      compressible: true,
      extensions: ["sls"]
    },
    "application/route-usd+xml": {
      source: "iana",
      compressible: true,
      extensions: ["rusd"]
    },
    "application/rpki-ghostbusters": {
      source: "iana",
      extensions: ["gbr"]
    },
    "application/rpki-manifest": {
      source: "iana",
      extensions: ["mft"]
    },
    "application/rpki-publication": {
      source: "iana"
    },
    "application/rpki-roa": {
      source: "iana",
      extensions: ["roa"]
    },
    "application/rpki-updown": {
      source: "iana"
    },
    "application/rsd+xml": {
      source: "apache",
      compressible: true,
      extensions: ["rsd"]
    },
    "application/rss+xml": {
      source: "apache",
      compressible: true,
      extensions: ["rss"]
    },
    "application/rtf": {
      source: "iana",
      compressible: true,
      extensions: ["rtf"]
    },
    "application/rtploopback": {
      source: "iana"
    },
    "application/rtx": {
      source: "iana"
    },
    "application/samlassertion+xml": {
      source: "iana",
      compressible: true
    },
    "application/samlmetadata+xml": {
      source: "iana",
      compressible: true
    },
    "application/sarif+json": {
      source: "iana",
      compressible: true
    },
    "application/sarif-external-properties+json": {
      source: "iana",
      compressible: true
    },
    "application/sbe": {
      source: "iana"
    },
    "application/sbml+xml": {
      source: "iana",
      compressible: true,
      extensions: ["sbml"]
    },
    "application/scaip+xml": {
      source: "iana",
      compressible: true
    },
    "application/scim+json": {
      source: "iana",
      compressible: true
    },
    "application/scvp-cv-request": {
      source: "iana",
      extensions: ["scq"]
    },
    "application/scvp-cv-response": {
      source: "iana",
      extensions: ["scs"]
    },
    "application/scvp-vp-request": {
      source: "iana",
      extensions: ["spq"]
    },
    "application/scvp-vp-response": {
      source: "iana",
      extensions: ["spp"]
    },
    "application/sdp": {
      source: "iana",
      extensions: ["sdp"]
    },
    "application/secevent+jwt": {
      source: "iana"
    },
    "application/senml+cbor": {
      source: "iana"
    },
    "application/senml+json": {
      source: "iana",
      compressible: true
    },
    "application/senml+xml": {
      source: "iana",
      compressible: true,
      extensions: ["senmlx"]
    },
    "application/senml-etch+cbor": {
      source: "iana"
    },
    "application/senml-etch+json": {
      source: "iana",
      compressible: true
    },
    "application/senml-exi": {
      source: "iana"
    },
    "application/sensml+cbor": {
      source: "iana"
    },
    "application/sensml+json": {
      source: "iana",
      compressible: true
    },
    "application/sensml+xml": {
      source: "iana",
      compressible: true,
      extensions: ["sensmlx"]
    },
    "application/sensml-exi": {
      source: "iana"
    },
    "application/sep+xml": {
      source: "iana",
      compressible: true
    },
    "application/sep-exi": {
      source: "iana"
    },
    "application/session-info": {
      source: "iana"
    },
    "application/set-payment": {
      source: "iana"
    },
    "application/set-payment-initiation": {
      source: "iana",
      extensions: ["setpay"]
    },
    "application/set-registration": {
      source: "iana"
    },
    "application/set-registration-initiation": {
      source: "iana",
      extensions: ["setreg"]
    },
    "application/sgml": {
      source: "iana"
    },
    "application/sgml-open-catalog": {
      source: "iana"
    },
    "application/shf+xml": {
      source: "iana",
      compressible: true,
      extensions: ["shf"]
    },
    "application/sieve": {
      source: "iana",
      extensions: ["siv", "sieve"]
    },
    "application/simple-filter+xml": {
      source: "iana",
      compressible: true
    },
    "application/simple-message-summary": {
      source: "iana"
    },
    "application/simplesymbolcontainer": {
      source: "iana"
    },
    "application/sipc": {
      source: "iana"
    },
    "application/slate": {
      source: "iana"
    },
    "application/smil": {
      source: "iana"
    },
    "application/smil+xml": {
      source: "iana",
      compressible: true,
      extensions: ["smi", "smil"]
    },
    "application/smpte336m": {
      source: "iana"
    },
    "application/soap+fastinfoset": {
      source: "iana"
    },
    "application/soap+xml": {
      source: "iana",
      compressible: true
    },
    "application/sparql-query": {
      source: "iana",
      extensions: ["rq"]
    },
    "application/sparql-results+xml": {
      source: "iana",
      compressible: true,
      extensions: ["srx"]
    },
    "application/spdx+json": {
      source: "iana",
      compressible: true
    },
    "application/spirits-event+xml": {
      source: "iana",
      compressible: true
    },
    "application/sql": {
      source: "iana"
    },
    "application/srgs": {
      source: "iana",
      extensions: ["gram"]
    },
    "application/srgs+xml": {
      source: "iana",
      compressible: true,
      extensions: ["grxml"]
    },
    "application/sru+xml": {
      source: "iana",
      compressible: true,
      extensions: ["sru"]
    },
    "application/ssdl+xml": {
      source: "apache",
      compressible: true,
      extensions: ["ssdl"]
    },
    "application/ssml+xml": {
      source: "iana",
      compressible: true,
      extensions: ["ssml"]
    },
    "application/stix+json": {
      source: "iana",
      compressible: true
    },
    "application/swid+xml": {
      source: "iana",
      compressible: true,
      extensions: ["swidtag"]
    },
    "application/tamp-apex-update": {
      source: "iana"
    },
    "application/tamp-apex-update-confirm": {
      source: "iana"
    },
    "application/tamp-community-update": {
      source: "iana"
    },
    "application/tamp-community-update-confirm": {
      source: "iana"
    },
    "application/tamp-error": {
      source: "iana"
    },
    "application/tamp-sequence-adjust": {
      source: "iana"
    },
    "application/tamp-sequence-adjust-confirm": {
      source: "iana"
    },
    "application/tamp-status-query": {
      source: "iana"
    },
    "application/tamp-status-response": {
      source: "iana"
    },
    "application/tamp-update": {
      source: "iana"
    },
    "application/tamp-update-confirm": {
      source: "iana"
    },
    "application/tar": {
      compressible: true
    },
    "application/taxii+json": {
      source: "iana",
      compressible: true
    },
    "application/td+json": {
      source: "iana",
      compressible: true
    },
    "application/tei+xml": {
      source: "iana",
      compressible: true,
      extensions: ["tei", "teicorpus"]
    },
    "application/tetra_isi": {
      source: "iana"
    },
    "application/thraud+xml": {
      source: "iana",
      compressible: true,
      extensions: ["tfi"]
    },
    "application/timestamp-query": {
      source: "iana"
    },
    "application/timestamp-reply": {
      source: "iana"
    },
    "application/timestamped-data": {
      source: "iana",
      extensions: ["tsd"]
    },
    "application/tlsrpt+gzip": {
      source: "iana"
    },
    "application/tlsrpt+json": {
      source: "iana",
      compressible: true
    },
    "application/tnauthlist": {
      source: "iana"
    },
    "application/token-introspection+jwt": {
      source: "iana"
    },
    "application/toml": {
      compressible: true,
      extensions: ["toml"]
    },
    "application/trickle-ice-sdpfrag": {
      source: "iana"
    },
    "application/trig": {
      source: "iana",
      extensions: ["trig"]
    },
    "application/ttml+xml": {
      source: "iana",
      compressible: true,
      extensions: ["ttml"]
    },
    "application/tve-trigger": {
      source: "iana"
    },
    "application/tzif": {
      source: "iana"
    },
    "application/tzif-leap": {
      source: "iana"
    },
    "application/ubjson": {
      compressible: false,
      extensions: ["ubj"]
    },
    "application/ulpfec": {
      source: "iana"
    },
    "application/urc-grpsheet+xml": {
      source: "iana",
      compressible: true
    },
    "application/urc-ressheet+xml": {
      source: "iana",
      compressible: true,
      extensions: ["rsheet"]
    },
    "application/urc-targetdesc+xml": {
      source: "iana",
      compressible: true,
      extensions: ["td"]
    },
    "application/urc-uisocketdesc+xml": {
      source: "iana",
      compressible: true
    },
    "application/vcard+json": {
      source: "iana",
      compressible: true
    },
    "application/vcard+xml": {
      source: "iana",
      compressible: true
    },
    "application/vemmi": {
      source: "iana"
    },
    "application/vividence.scriptfile": {
      source: "apache"
    },
    "application/vnd.1000minds.decision-model+xml": {
      source: "iana",
      compressible: true,
      extensions: ["1km"]
    },
    "application/vnd.3gpp-prose+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.3gpp-prose-pc3ch+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.3gpp-v2x-local-service-information": {
      source: "iana"
    },
    "application/vnd.3gpp.5gnas": {
      source: "iana"
    },
    "application/vnd.3gpp.access-transfer-events+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.3gpp.bsf+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.3gpp.gmop+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.3gpp.gtpc": {
      source: "iana"
    },
    "application/vnd.3gpp.interworking-data": {
      source: "iana"
    },
    "application/vnd.3gpp.lpp": {
      source: "iana"
    },
    "application/vnd.3gpp.mc-signalling-ear": {
      source: "iana"
    },
    "application/vnd.3gpp.mcdata-affiliation-command+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.3gpp.mcdata-info+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.3gpp.mcdata-payload": {
      source: "iana"
    },
    "application/vnd.3gpp.mcdata-service-config+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.3gpp.mcdata-signalling": {
      source: "iana"
    },
    "application/vnd.3gpp.mcdata-ue-config+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.3gpp.mcdata-user-profile+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.3gpp.mcptt-affiliation-command+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.3gpp.mcptt-floor-request+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.3gpp.mcptt-info+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.3gpp.mcptt-location-info+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.3gpp.mcptt-mbms-usage-info+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.3gpp.mcptt-service-config+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.3gpp.mcptt-signed+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.3gpp.mcptt-ue-config+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.3gpp.mcptt-ue-init-config+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.3gpp.mcptt-user-profile+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.3gpp.mcvideo-affiliation-command+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.3gpp.mcvideo-affiliation-info+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.3gpp.mcvideo-info+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.3gpp.mcvideo-location-info+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.3gpp.mcvideo-mbms-usage-info+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.3gpp.mcvideo-service-config+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.3gpp.mcvideo-transmission-request+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.3gpp.mcvideo-ue-config+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.3gpp.mcvideo-user-profile+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.3gpp.mid-call+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.3gpp.ngap": {
      source: "iana"
    },
    "application/vnd.3gpp.pfcp": {
      source: "iana"
    },
    "application/vnd.3gpp.pic-bw-large": {
      source: "iana",
      extensions: ["plb"]
    },
    "application/vnd.3gpp.pic-bw-small": {
      source: "iana",
      extensions: ["psb"]
    },
    "application/vnd.3gpp.pic-bw-var": {
      source: "iana",
      extensions: ["pvb"]
    },
    "application/vnd.3gpp.s1ap": {
      source: "iana"
    },
    "application/vnd.3gpp.sms": {
      source: "iana"
    },
    "application/vnd.3gpp.sms+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.3gpp.srvcc-ext+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.3gpp.srvcc-info+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.3gpp.state-and-event-info+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.3gpp.ussd+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.3gpp2.bcmcsinfo+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.3gpp2.sms": {
      source: "iana"
    },
    "application/vnd.3gpp2.tcap": {
      source: "iana",
      extensions: ["tcap"]
    },
    "application/vnd.3lightssoftware.imagescal": {
      source: "iana"
    },
    "application/vnd.3m.post-it-notes": {
      source: "iana",
      extensions: ["pwn"]
    },
    "application/vnd.accpac.simply.aso": {
      source: "iana",
      extensions: ["aso"]
    },
    "application/vnd.accpac.simply.imp": {
      source: "iana",
      extensions: ["imp"]
    },
    "application/vnd.acucobol": {
      source: "iana",
      extensions: ["acu"]
    },
    "application/vnd.acucorp": {
      source: "iana",
      extensions: ["atc", "acutc"]
    },
    "application/vnd.adobe.air-application-installer-package+zip": {
      source: "apache",
      compressible: false,
      extensions: ["air"]
    },
    "application/vnd.adobe.flash.movie": {
      source: "iana"
    },
    "application/vnd.adobe.formscentral.fcdt": {
      source: "iana",
      extensions: ["fcdt"]
    },
    "application/vnd.adobe.fxp": {
      source: "iana",
      extensions: ["fxp", "fxpl"]
    },
    "application/vnd.adobe.partial-upload": {
      source: "iana"
    },
    "application/vnd.adobe.xdp+xml": {
      source: "iana",
      compressible: true,
      extensions: ["xdp"]
    },
    "application/vnd.adobe.xfdf": {
      source: "iana",
      extensions: ["xfdf"]
    },
    "application/vnd.aether.imp": {
      source: "iana"
    },
    "application/vnd.afpc.afplinedata": {
      source: "iana"
    },
    "application/vnd.afpc.afplinedata-pagedef": {
      source: "iana"
    },
    "application/vnd.afpc.cmoca-cmresource": {
      source: "iana"
    },
    "application/vnd.afpc.foca-charset": {
      source: "iana"
    },
    "application/vnd.afpc.foca-codedfont": {
      source: "iana"
    },
    "application/vnd.afpc.foca-codepage": {
      source: "iana"
    },
    "application/vnd.afpc.modca": {
      source: "iana"
    },
    "application/vnd.afpc.modca-cmtable": {
      source: "iana"
    },
    "application/vnd.afpc.modca-formdef": {
      source: "iana"
    },
    "application/vnd.afpc.modca-mediummap": {
      source: "iana"
    },
    "application/vnd.afpc.modca-objectcontainer": {
      source: "iana"
    },
    "application/vnd.afpc.modca-overlay": {
      source: "iana"
    },
    "application/vnd.afpc.modca-pagesegment": {
      source: "iana"
    },
    "application/vnd.age": {
      source: "iana",
      extensions: ["age"]
    },
    "application/vnd.ah-barcode": {
      source: "iana"
    },
    "application/vnd.ahead.space": {
      source: "iana",
      extensions: ["ahead"]
    },
    "application/vnd.airzip.filesecure.azf": {
      source: "iana",
      extensions: ["azf"]
    },
    "application/vnd.airzip.filesecure.azs": {
      source: "iana",
      extensions: ["azs"]
    },
    "application/vnd.amadeus+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.amazon.ebook": {
      source: "apache",
      extensions: ["azw"]
    },
    "application/vnd.amazon.mobi8-ebook": {
      source: "iana"
    },
    "application/vnd.americandynamics.acc": {
      source: "iana",
      extensions: ["acc"]
    },
    "application/vnd.amiga.ami": {
      source: "iana",
      extensions: ["ami"]
    },
    "application/vnd.amundsen.maze+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.android.ota": {
      source: "iana"
    },
    "application/vnd.android.package-archive": {
      source: "apache",
      compressible: false,
      extensions: ["apk"]
    },
    "application/vnd.anki": {
      source: "iana"
    },
    "application/vnd.anser-web-certificate-issue-initiation": {
      source: "iana",
      extensions: ["cii"]
    },
    "application/vnd.anser-web-funds-transfer-initiation": {
      source: "apache",
      extensions: ["fti"]
    },
    "application/vnd.antix.game-component": {
      source: "iana",
      extensions: ["atx"]
    },
    "application/vnd.apache.arrow.file": {
      source: "iana"
    },
    "application/vnd.apache.arrow.stream": {
      source: "iana"
    },
    "application/vnd.apache.thrift.binary": {
      source: "iana"
    },
    "application/vnd.apache.thrift.compact": {
      source: "iana"
    },
    "application/vnd.apache.thrift.json": {
      source: "iana"
    },
    "application/vnd.api+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.aplextor.warrp+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.apothekende.reservation+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.apple.installer+xml": {
      source: "iana",
      compressible: true,
      extensions: ["mpkg"]
    },
    "application/vnd.apple.keynote": {
      source: "iana",
      extensions: ["key"]
    },
    "application/vnd.apple.mpegurl": {
      source: "iana",
      extensions: ["m3u8"]
    },
    "application/vnd.apple.numbers": {
      source: "iana",
      extensions: ["numbers"]
    },
    "application/vnd.apple.pages": {
      source: "iana",
      extensions: ["pages"]
    },
    "application/vnd.apple.pkpass": {
      compressible: false,
      extensions: ["pkpass"]
    },
    "application/vnd.arastra.swi": {
      source: "iana"
    },
    "application/vnd.aristanetworks.swi": {
      source: "iana",
      extensions: ["swi"]
    },
    "application/vnd.artisan+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.artsquare": {
      source: "iana"
    },
    "application/vnd.astraea-software.iota": {
      source: "iana",
      extensions: ["iota"]
    },
    "application/vnd.audiograph": {
      source: "iana",
      extensions: ["aep"]
    },
    "application/vnd.autopackage": {
      source: "iana"
    },
    "application/vnd.avalon+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.avistar+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.balsamiq.bmml+xml": {
      source: "iana",
      compressible: true,
      extensions: ["bmml"]
    },
    "application/vnd.balsamiq.bmpr": {
      source: "iana"
    },
    "application/vnd.banana-accounting": {
      source: "iana"
    },
    "application/vnd.bbf.usp.error": {
      source: "iana"
    },
    "application/vnd.bbf.usp.msg": {
      source: "iana"
    },
    "application/vnd.bbf.usp.msg+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.bekitzur-stech+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.bint.med-content": {
      source: "iana"
    },
    "application/vnd.biopax.rdf+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.blink-idb-value-wrapper": {
      source: "iana"
    },
    "application/vnd.blueice.multipass": {
      source: "iana",
      extensions: ["mpm"]
    },
    "application/vnd.bluetooth.ep.oob": {
      source: "iana"
    },
    "application/vnd.bluetooth.le.oob": {
      source: "iana"
    },
    "application/vnd.bmi": {
      source: "iana",
      extensions: ["bmi"]
    },
    "application/vnd.bpf": {
      source: "iana"
    },
    "application/vnd.bpf3": {
      source: "iana"
    },
    "application/vnd.businessobjects": {
      source: "iana",
      extensions: ["rep"]
    },
    "application/vnd.byu.uapi+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.cab-jscript": {
      source: "iana"
    },
    "application/vnd.canon-cpdl": {
      source: "iana"
    },
    "application/vnd.canon-lips": {
      source: "iana"
    },
    "application/vnd.capasystems-pg+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.cendio.thinlinc.clientconf": {
      source: "iana"
    },
    "application/vnd.century-systems.tcp_stream": {
      source: "iana"
    },
    "application/vnd.chemdraw+xml": {
      source: "iana",
      compressible: true,
      extensions: ["cdxml"]
    },
    "application/vnd.chess-pgn": {
      source: "iana"
    },
    "application/vnd.chipnuts.karaoke-mmd": {
      source: "iana",
      extensions: ["mmd"]
    },
    "application/vnd.ciedi": {
      source: "iana"
    },
    "application/vnd.cinderella": {
      source: "iana",
      extensions: ["cdy"]
    },
    "application/vnd.cirpack.isdn-ext": {
      source: "iana"
    },
    "application/vnd.citationstyles.style+xml": {
      source: "iana",
      compressible: true,
      extensions: ["csl"]
    },
    "application/vnd.claymore": {
      source: "iana",
      extensions: ["cla"]
    },
    "application/vnd.cloanto.rp9": {
      source: "iana",
      extensions: ["rp9"]
    },
    "application/vnd.clonk.c4group": {
      source: "iana",
      extensions: ["c4g", "c4d", "c4f", "c4p", "c4u"]
    },
    "application/vnd.cluetrust.cartomobile-config": {
      source: "iana",
      extensions: ["c11amc"]
    },
    "application/vnd.cluetrust.cartomobile-config-pkg": {
      source: "iana",
      extensions: ["c11amz"]
    },
    "application/vnd.coffeescript": {
      source: "iana"
    },
    "application/vnd.collabio.xodocuments.document": {
      source: "iana"
    },
    "application/vnd.collabio.xodocuments.document-template": {
      source: "iana"
    },
    "application/vnd.collabio.xodocuments.presentation": {
      source: "iana"
    },
    "application/vnd.collabio.xodocuments.presentation-template": {
      source: "iana"
    },
    "application/vnd.collabio.xodocuments.spreadsheet": {
      source: "iana"
    },
    "application/vnd.collabio.xodocuments.spreadsheet-template": {
      source: "iana"
    },
    "application/vnd.collection+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.collection.doc+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.collection.next+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.comicbook+zip": {
      source: "iana",
      compressible: false
    },
    "application/vnd.comicbook-rar": {
      source: "iana"
    },
    "application/vnd.commerce-battelle": {
      source: "iana"
    },
    "application/vnd.commonspace": {
      source: "iana",
      extensions: ["csp"]
    },
    "application/vnd.contact.cmsg": {
      source: "iana",
      extensions: ["cdbcmsg"]
    },
    "application/vnd.coreos.ignition+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.cosmocaller": {
      source: "iana",
      extensions: ["cmc"]
    },
    "application/vnd.crick.clicker": {
      source: "iana",
      extensions: ["clkx"]
    },
    "application/vnd.crick.clicker.keyboard": {
      source: "iana",
      extensions: ["clkk"]
    },
    "application/vnd.crick.clicker.palette": {
      source: "iana",
      extensions: ["clkp"]
    },
    "application/vnd.crick.clicker.template": {
      source: "iana",
      extensions: ["clkt"]
    },
    "application/vnd.crick.clicker.wordbank": {
      source: "iana",
      extensions: ["clkw"]
    },
    "application/vnd.criticaltools.wbs+xml": {
      source: "iana",
      compressible: true,
      extensions: ["wbs"]
    },
    "application/vnd.cryptii.pipe+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.crypto-shade-file": {
      source: "iana"
    },
    "application/vnd.cryptomator.encrypted": {
      source: "iana"
    },
    "application/vnd.cryptomator.vault": {
      source: "iana"
    },
    "application/vnd.ctc-posml": {
      source: "iana",
      extensions: ["pml"]
    },
    "application/vnd.ctct.ws+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.cups-pdf": {
      source: "iana"
    },
    "application/vnd.cups-postscript": {
      source: "iana"
    },
    "application/vnd.cups-ppd": {
      source: "iana",
      extensions: ["ppd"]
    },
    "application/vnd.cups-raster": {
      source: "iana"
    },
    "application/vnd.cups-raw": {
      source: "iana"
    },
    "application/vnd.curl": {
      source: "iana"
    },
    "application/vnd.curl.car": {
      source: "apache",
      extensions: ["car"]
    },
    "application/vnd.curl.pcurl": {
      source: "apache",
      extensions: ["pcurl"]
    },
    "application/vnd.cyan.dean.root+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.cybank": {
      source: "iana"
    },
    "application/vnd.cyclonedx+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.cyclonedx+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.d2l.coursepackage1p0+zip": {
      source: "iana",
      compressible: false
    },
    "application/vnd.d3m-dataset": {
      source: "iana"
    },
    "application/vnd.d3m-problem": {
      source: "iana"
    },
    "application/vnd.dart": {
      source: "iana",
      compressible: true,
      extensions: ["dart"]
    },
    "application/vnd.data-vision.rdz": {
      source: "iana",
      extensions: ["rdz"]
    },
    "application/vnd.datapackage+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.dataresource+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.dbf": {
      source: "iana",
      extensions: ["dbf"]
    },
    "application/vnd.debian.binary-package": {
      source: "iana"
    },
    "application/vnd.dece.data": {
      source: "iana",
      extensions: ["uvf", "uvvf", "uvd", "uvvd"]
    },
    "application/vnd.dece.ttml+xml": {
      source: "iana",
      compressible: true,
      extensions: ["uvt", "uvvt"]
    },
    "application/vnd.dece.unspecified": {
      source: "iana",
      extensions: ["uvx", "uvvx"]
    },
    "application/vnd.dece.zip": {
      source: "iana",
      extensions: ["uvz", "uvvz"]
    },
    "application/vnd.denovo.fcselayout-link": {
      source: "iana",
      extensions: ["fe_launch"]
    },
    "application/vnd.desmume.movie": {
      source: "iana"
    },
    "application/vnd.dir-bi.plate-dl-nosuffix": {
      source: "iana"
    },
    "application/vnd.dm.delegation+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.dna": {
      source: "iana",
      extensions: ["dna"]
    },
    "application/vnd.document+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.dolby.mlp": {
      source: "apache",
      extensions: ["mlp"]
    },
    "application/vnd.dolby.mobile.1": {
      source: "iana"
    },
    "application/vnd.dolby.mobile.2": {
      source: "iana"
    },
    "application/vnd.doremir.scorecloud-binary-document": {
      source: "iana"
    },
    "application/vnd.dpgraph": {
      source: "iana",
      extensions: ["dpg"]
    },
    "application/vnd.dreamfactory": {
      source: "iana",
      extensions: ["dfac"]
    },
    "application/vnd.drive+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.ds-keypoint": {
      source: "apache",
      extensions: ["kpxx"]
    },
    "application/vnd.dtg.local": {
      source: "iana"
    },
    "application/vnd.dtg.local.flash": {
      source: "iana"
    },
    "application/vnd.dtg.local.html": {
      source: "iana"
    },
    "application/vnd.dvb.ait": {
      source: "iana",
      extensions: ["ait"]
    },
    "application/vnd.dvb.dvbisl+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.dvb.dvbj": {
      source: "iana"
    },
    "application/vnd.dvb.esgcontainer": {
      source: "iana"
    },
    "application/vnd.dvb.ipdcdftnotifaccess": {
      source: "iana"
    },
    "application/vnd.dvb.ipdcesgaccess": {
      source: "iana"
    },
    "application/vnd.dvb.ipdcesgaccess2": {
      source: "iana"
    },
    "application/vnd.dvb.ipdcesgpdd": {
      source: "iana"
    },
    "application/vnd.dvb.ipdcroaming": {
      source: "iana"
    },
    "application/vnd.dvb.iptv.alfec-base": {
      source: "iana"
    },
    "application/vnd.dvb.iptv.alfec-enhancement": {
      source: "iana"
    },
    "application/vnd.dvb.notif-aggregate-root+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.dvb.notif-container+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.dvb.notif-generic+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.dvb.notif-ia-msglist+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.dvb.notif-ia-registration-request+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.dvb.notif-ia-registration-response+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.dvb.notif-init+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.dvb.pfr": {
      source: "iana"
    },
    "application/vnd.dvb.service": {
      source: "iana",
      extensions: ["svc"]
    },
    "application/vnd.dxr": {
      source: "iana"
    },
    "application/vnd.dynageo": {
      source: "iana",
      extensions: ["geo"]
    },
    "application/vnd.dzr": {
      source: "iana"
    },
    "application/vnd.easykaraoke.cdgdownload": {
      source: "iana"
    },
    "application/vnd.ecdis-update": {
      source: "iana"
    },
    "application/vnd.ecip.rlp": {
      source: "iana"
    },
    "application/vnd.eclipse.ditto+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.ecowin.chart": {
      source: "iana",
      extensions: ["mag"]
    },
    "application/vnd.ecowin.filerequest": {
      source: "iana"
    },
    "application/vnd.ecowin.fileupdate": {
      source: "iana"
    },
    "application/vnd.ecowin.series": {
      source: "iana"
    },
    "application/vnd.ecowin.seriesrequest": {
      source: "iana"
    },
    "application/vnd.ecowin.seriesupdate": {
      source: "iana"
    },
    "application/vnd.efi.img": {
      source: "iana"
    },
    "application/vnd.efi.iso": {
      source: "iana"
    },
    "application/vnd.emclient.accessrequest+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.enliven": {
      source: "iana",
      extensions: ["nml"]
    },
    "application/vnd.enphase.envoy": {
      source: "iana"
    },
    "application/vnd.eprints.data+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.epson.esf": {
      source: "iana",
      extensions: ["esf"]
    },
    "application/vnd.epson.msf": {
      source: "iana",
      extensions: ["msf"]
    },
    "application/vnd.epson.quickanime": {
      source: "iana",
      extensions: ["qam"]
    },
    "application/vnd.epson.salt": {
      source: "iana",
      extensions: ["slt"]
    },
    "application/vnd.epson.ssf": {
      source: "iana",
      extensions: ["ssf"]
    },
    "application/vnd.ericsson.quickcall": {
      source: "iana"
    },
    "application/vnd.espass-espass+zip": {
      source: "iana",
      compressible: false
    },
    "application/vnd.eszigno3+xml": {
      source: "iana",
      compressible: true,
      extensions: ["es3", "et3"]
    },
    "application/vnd.etsi.aoc+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.etsi.asic-e+zip": {
      source: "iana",
      compressible: false
    },
    "application/vnd.etsi.asic-s+zip": {
      source: "iana",
      compressible: false
    },
    "application/vnd.etsi.cug+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.etsi.iptvcommand+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.etsi.iptvdiscovery+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.etsi.iptvprofile+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.etsi.iptvsad-bc+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.etsi.iptvsad-cod+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.etsi.iptvsad-npvr+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.etsi.iptvservice+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.etsi.iptvsync+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.etsi.iptvueprofile+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.etsi.mcid+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.etsi.mheg5": {
      source: "iana"
    },
    "application/vnd.etsi.overload-control-policy-dataset+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.etsi.pstn+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.etsi.sci+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.etsi.simservs+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.etsi.timestamp-token": {
      source: "iana"
    },
    "application/vnd.etsi.tsl+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.etsi.tsl.der": {
      source: "iana"
    },
    "application/vnd.eu.kasparian.car+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.eudora.data": {
      source: "iana"
    },
    "application/vnd.evolv.ecig.profile": {
      source: "iana"
    },
    "application/vnd.evolv.ecig.settings": {
      source: "iana"
    },
    "application/vnd.evolv.ecig.theme": {
      source: "iana"
    },
    "application/vnd.exstream-empower+zip": {
      source: "iana",
      compressible: false
    },
    "application/vnd.exstream-package": {
      source: "iana"
    },
    "application/vnd.ezpix-album": {
      source: "iana",
      extensions: ["ez2"]
    },
    "application/vnd.ezpix-package": {
      source: "iana",
      extensions: ["ez3"]
    },
    "application/vnd.f-secure.mobile": {
      source: "iana"
    },
    "application/vnd.familysearch.gedcom+zip": {
      source: "iana",
      compressible: false
    },
    "application/vnd.fastcopy-disk-image": {
      source: "iana"
    },
    "application/vnd.fdf": {
      source: "iana",
      extensions: ["fdf"]
    },
    "application/vnd.fdsn.mseed": {
      source: "iana",
      extensions: ["mseed"]
    },
    "application/vnd.fdsn.seed": {
      source: "iana",
      extensions: ["seed", "dataless"]
    },
    "application/vnd.ffsns": {
      source: "iana"
    },
    "application/vnd.ficlab.flb+zip": {
      source: "iana",
      compressible: false
    },
    "application/vnd.filmit.zfc": {
      source: "iana"
    },
    "application/vnd.fints": {
      source: "iana"
    },
    "application/vnd.firemonkeys.cloudcell": {
      source: "iana"
    },
    "application/vnd.flographit": {
      source: "iana",
      extensions: ["gph"]
    },
    "application/vnd.fluxtime.clip": {
      source: "iana",
      extensions: ["ftc"]
    },
    "application/vnd.font-fontforge-sfd": {
      source: "iana"
    },
    "application/vnd.framemaker": {
      source: "iana",
      extensions: ["fm", "frame", "maker", "book"]
    },
    "application/vnd.frogans.fnc": {
      source: "iana",
      extensions: ["fnc"]
    },
    "application/vnd.frogans.ltf": {
      source: "iana",
      extensions: ["ltf"]
    },
    "application/vnd.fsc.weblaunch": {
      source: "iana",
      extensions: ["fsc"]
    },
    "application/vnd.fujifilm.fb.docuworks": {
      source: "iana"
    },
    "application/vnd.fujifilm.fb.docuworks.binder": {
      source: "iana"
    },
    "application/vnd.fujifilm.fb.docuworks.container": {
      source: "iana"
    },
    "application/vnd.fujifilm.fb.jfi+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.fujitsu.oasys": {
      source: "iana",
      extensions: ["oas"]
    },
    "application/vnd.fujitsu.oasys2": {
      source: "iana",
      extensions: ["oa2"]
    },
    "application/vnd.fujitsu.oasys3": {
      source: "iana",
      extensions: ["oa3"]
    },
    "application/vnd.fujitsu.oasysgp": {
      source: "iana",
      extensions: ["fg5"]
    },
    "application/vnd.fujitsu.oasysprs": {
      source: "iana",
      extensions: ["bh2"]
    },
    "application/vnd.fujixerox.art-ex": {
      source: "iana"
    },
    "application/vnd.fujixerox.art4": {
      source: "iana"
    },
    "application/vnd.fujixerox.ddd": {
      source: "iana",
      extensions: ["ddd"]
    },
    "application/vnd.fujixerox.docuworks": {
      source: "iana",
      extensions: ["xdw"]
    },
    "application/vnd.fujixerox.docuworks.binder": {
      source: "iana",
      extensions: ["xbd"]
    },
    "application/vnd.fujixerox.docuworks.container": {
      source: "iana"
    },
    "application/vnd.fujixerox.hbpl": {
      source: "iana"
    },
    "application/vnd.fut-misnet": {
      source: "iana"
    },
    "application/vnd.futoin+cbor": {
      source: "iana"
    },
    "application/vnd.futoin+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.fuzzysheet": {
      source: "iana",
      extensions: ["fzs"]
    },
    "application/vnd.genomatix.tuxedo": {
      source: "iana",
      extensions: ["txd"]
    },
    "application/vnd.gentics.grd+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.geo+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.geocube+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.geogebra.file": {
      source: "iana",
      extensions: ["ggb"]
    },
    "application/vnd.geogebra.slides": {
      source: "iana"
    },
    "application/vnd.geogebra.tool": {
      source: "iana",
      extensions: ["ggt"]
    },
    "application/vnd.geometry-explorer": {
      source: "iana",
      extensions: ["gex", "gre"]
    },
    "application/vnd.geonext": {
      source: "iana",
      extensions: ["gxt"]
    },
    "application/vnd.geoplan": {
      source: "iana",
      extensions: ["g2w"]
    },
    "application/vnd.geospace": {
      source: "iana",
      extensions: ["g3w"]
    },
    "application/vnd.gerber": {
      source: "iana"
    },
    "application/vnd.globalplatform.card-content-mgt": {
      source: "iana"
    },
    "application/vnd.globalplatform.card-content-mgt-response": {
      source: "iana"
    },
    "application/vnd.gmx": {
      source: "iana",
      extensions: ["gmx"]
    },
    "application/vnd.google-apps.document": {
      compressible: false,
      extensions: ["gdoc"]
    },
    "application/vnd.google-apps.presentation": {
      compressible: false,
      extensions: ["gslides"]
    },
    "application/vnd.google-apps.spreadsheet": {
      compressible: false,
      extensions: ["gsheet"]
    },
    "application/vnd.google-earth.kml+xml": {
      source: "iana",
      compressible: true,
      extensions: ["kml"]
    },
    "application/vnd.google-earth.kmz": {
      source: "iana",
      compressible: false,
      extensions: ["kmz"]
    },
    "application/vnd.gov.sk.e-form+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.gov.sk.e-form+zip": {
      source: "iana",
      compressible: false
    },
    "application/vnd.gov.sk.xmldatacontainer+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.grafeq": {
      source: "iana",
      extensions: ["gqf", "gqs"]
    },
    "application/vnd.gridmp": {
      source: "iana"
    },
    "application/vnd.groove-account": {
      source: "iana",
      extensions: ["gac"]
    },
    "application/vnd.groove-help": {
      source: "iana",
      extensions: ["ghf"]
    },
    "application/vnd.groove-identity-message": {
      source: "iana",
      extensions: ["gim"]
    },
    "application/vnd.groove-injector": {
      source: "iana",
      extensions: ["grv"]
    },
    "application/vnd.groove-tool-message": {
      source: "iana",
      extensions: ["gtm"]
    },
    "application/vnd.groove-tool-template": {
      source: "iana",
      extensions: ["tpl"]
    },
    "application/vnd.groove-vcard": {
      source: "iana",
      extensions: ["vcg"]
    },
    "application/vnd.hal+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.hal+xml": {
      source: "iana",
      compressible: true,
      extensions: ["hal"]
    },
    "application/vnd.handheld-entertainment+xml": {
      source: "iana",
      compressible: true,
      extensions: ["zmm"]
    },
    "application/vnd.hbci": {
      source: "iana",
      extensions: ["hbci"]
    },
    "application/vnd.hc+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.hcl-bireports": {
      source: "iana"
    },
    "application/vnd.hdt": {
      source: "iana"
    },
    "application/vnd.heroku+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.hhe.lesson-player": {
      source: "iana",
      extensions: ["les"]
    },
    "application/vnd.hl7cda+xml": {
      source: "iana",
      charset: "UTF-8",
      compressible: true
    },
    "application/vnd.hl7v2+xml": {
      source: "iana",
      charset: "UTF-8",
      compressible: true
    },
    "application/vnd.hp-hpgl": {
      source: "iana",
      extensions: ["hpgl"]
    },
    "application/vnd.hp-hpid": {
      source: "iana",
      extensions: ["hpid"]
    },
    "application/vnd.hp-hps": {
      source: "iana",
      extensions: ["hps"]
    },
    "application/vnd.hp-jlyt": {
      source: "iana",
      extensions: ["jlt"]
    },
    "application/vnd.hp-pcl": {
      source: "iana",
      extensions: ["pcl"]
    },
    "application/vnd.hp-pclxl": {
      source: "iana",
      extensions: ["pclxl"]
    },
    "application/vnd.httphone": {
      source: "iana"
    },
    "application/vnd.hydrostatix.sof-data": {
      source: "iana",
      extensions: ["sfd-hdstx"]
    },
    "application/vnd.hyper+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.hyper-item+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.hyperdrive+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.hzn-3d-crossword": {
      source: "iana"
    },
    "application/vnd.ibm.afplinedata": {
      source: "iana"
    },
    "application/vnd.ibm.electronic-media": {
      source: "iana"
    },
    "application/vnd.ibm.minipay": {
      source: "iana",
      extensions: ["mpy"]
    },
    "application/vnd.ibm.modcap": {
      source: "iana",
      extensions: ["afp", "listafp", "list3820"]
    },
    "application/vnd.ibm.rights-management": {
      source: "iana",
      extensions: ["irm"]
    },
    "application/vnd.ibm.secure-container": {
      source: "iana",
      extensions: ["sc"]
    },
    "application/vnd.iccprofile": {
      source: "iana",
      extensions: ["icc", "icm"]
    },
    "application/vnd.ieee.1905": {
      source: "iana"
    },
    "application/vnd.igloader": {
      source: "iana",
      extensions: ["igl"]
    },
    "application/vnd.imagemeter.folder+zip": {
      source: "iana",
      compressible: false
    },
    "application/vnd.imagemeter.image+zip": {
      source: "iana",
      compressible: false
    },
    "application/vnd.immervision-ivp": {
      source: "iana",
      extensions: ["ivp"]
    },
    "application/vnd.immervision-ivu": {
      source: "iana",
      extensions: ["ivu"]
    },
    "application/vnd.ims.imsccv1p1": {
      source: "iana"
    },
    "application/vnd.ims.imsccv1p2": {
      source: "iana"
    },
    "application/vnd.ims.imsccv1p3": {
      source: "iana"
    },
    "application/vnd.ims.lis.v2.result+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.ims.lti.v2.toolconsumerprofile+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.ims.lti.v2.toolproxy+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.ims.lti.v2.toolproxy.id+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.ims.lti.v2.toolsettings+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.ims.lti.v2.toolsettings.simple+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.informedcontrol.rms+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.informix-visionary": {
      source: "iana"
    },
    "application/vnd.infotech.project": {
      source: "iana"
    },
    "application/vnd.infotech.project+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.innopath.wamp.notification": {
      source: "iana"
    },
    "application/vnd.insors.igm": {
      source: "iana",
      extensions: ["igm"]
    },
    "application/vnd.intercon.formnet": {
      source: "iana",
      extensions: ["xpw", "xpx"]
    },
    "application/vnd.intergeo": {
      source: "iana",
      extensions: ["i2g"]
    },
    "application/vnd.intertrust.digibox": {
      source: "iana"
    },
    "application/vnd.intertrust.nncp": {
      source: "iana"
    },
    "application/vnd.intu.qbo": {
      source: "iana",
      extensions: ["qbo"]
    },
    "application/vnd.intu.qfx": {
      source: "iana",
      extensions: ["qfx"]
    },
    "application/vnd.iptc.g2.catalogitem+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.iptc.g2.conceptitem+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.iptc.g2.knowledgeitem+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.iptc.g2.newsitem+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.iptc.g2.newsmessage+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.iptc.g2.packageitem+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.iptc.g2.planningitem+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.ipunplugged.rcprofile": {
      source: "iana",
      extensions: ["rcprofile"]
    },
    "application/vnd.irepository.package+xml": {
      source: "iana",
      compressible: true,
      extensions: ["irp"]
    },
    "application/vnd.is-xpr": {
      source: "iana",
      extensions: ["xpr"]
    },
    "application/vnd.isac.fcs": {
      source: "iana",
      extensions: ["fcs"]
    },
    "application/vnd.iso11783-10+zip": {
      source: "iana",
      compressible: false
    },
    "application/vnd.jam": {
      source: "iana",
      extensions: ["jam"]
    },
    "application/vnd.japannet-directory-service": {
      source: "iana"
    },
    "application/vnd.japannet-jpnstore-wakeup": {
      source: "iana"
    },
    "application/vnd.japannet-payment-wakeup": {
      source: "iana"
    },
    "application/vnd.japannet-registration": {
      source: "iana"
    },
    "application/vnd.japannet-registration-wakeup": {
      source: "iana"
    },
    "application/vnd.japannet-setstore-wakeup": {
      source: "iana"
    },
    "application/vnd.japannet-verification": {
      source: "iana"
    },
    "application/vnd.japannet-verification-wakeup": {
      source: "iana"
    },
    "application/vnd.jcp.javame.midlet-rms": {
      source: "iana",
      extensions: ["rms"]
    },
    "application/vnd.jisp": {
      source: "iana",
      extensions: ["jisp"]
    },
    "application/vnd.joost.joda-archive": {
      source: "iana",
      extensions: ["joda"]
    },
    "application/vnd.jsk.isdn-ngn": {
      source: "iana"
    },
    "application/vnd.kahootz": {
      source: "iana",
      extensions: ["ktz", "ktr"]
    },
    "application/vnd.kde.karbon": {
      source: "iana",
      extensions: ["karbon"]
    },
    "application/vnd.kde.kchart": {
      source: "iana",
      extensions: ["chrt"]
    },
    "application/vnd.kde.kformula": {
      source: "iana",
      extensions: ["kfo"]
    },
    "application/vnd.kde.kivio": {
      source: "iana",
      extensions: ["flw"]
    },
    "application/vnd.kde.kontour": {
      source: "iana",
      extensions: ["kon"]
    },
    "application/vnd.kde.kpresenter": {
      source: "iana",
      extensions: ["kpr", "kpt"]
    },
    "application/vnd.kde.kspread": {
      source: "iana",
      extensions: ["ksp"]
    },
    "application/vnd.kde.kword": {
      source: "iana",
      extensions: ["kwd", "kwt"]
    },
    "application/vnd.kenameaapp": {
      source: "iana",
      extensions: ["htke"]
    },
    "application/vnd.kidspiration": {
      source: "iana",
      extensions: ["kia"]
    },
    "application/vnd.kinar": {
      source: "iana",
      extensions: ["kne", "knp"]
    },
    "application/vnd.koan": {
      source: "iana",
      extensions: ["skp", "skd", "skt", "skm"]
    },
    "application/vnd.kodak-descriptor": {
      source: "iana",
      extensions: ["sse"]
    },
    "application/vnd.las": {
      source: "iana"
    },
    "application/vnd.las.las+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.las.las+xml": {
      source: "iana",
      compressible: true,
      extensions: ["lasxml"]
    },
    "application/vnd.laszip": {
      source: "iana"
    },
    "application/vnd.leap+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.liberty-request+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.llamagraphics.life-balance.desktop": {
      source: "iana",
      extensions: ["lbd"]
    },
    "application/vnd.llamagraphics.life-balance.exchange+xml": {
      source: "iana",
      compressible: true,
      extensions: ["lbe"]
    },
    "application/vnd.logipipe.circuit+zip": {
      source: "iana",
      compressible: false
    },
    "application/vnd.loom": {
      source: "iana"
    },
    "application/vnd.lotus-1-2-3": {
      source: "iana",
      extensions: ["123"]
    },
    "application/vnd.lotus-approach": {
      source: "iana",
      extensions: ["apr"]
    },
    "application/vnd.lotus-freelance": {
      source: "iana",
      extensions: ["pre"]
    },
    "application/vnd.lotus-notes": {
      source: "iana",
      extensions: ["nsf"]
    },
    "application/vnd.lotus-organizer": {
      source: "iana",
      extensions: ["org"]
    },
    "application/vnd.lotus-screencam": {
      source: "iana",
      extensions: ["scm"]
    },
    "application/vnd.lotus-wordpro": {
      source: "iana",
      extensions: ["lwp"]
    },
    "application/vnd.macports.portpkg": {
      source: "iana",
      extensions: ["portpkg"]
    },
    "application/vnd.mapbox-vector-tile": {
      source: "iana",
      extensions: ["mvt"]
    },
    "application/vnd.marlin.drm.actiontoken+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.marlin.drm.conftoken+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.marlin.drm.license+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.marlin.drm.mdcf": {
      source: "iana"
    },
    "application/vnd.mason+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.maxar.archive.3tz+zip": {
      source: "iana",
      compressible: false
    },
    "application/vnd.maxmind.maxmind-db": {
      source: "iana"
    },
    "application/vnd.mcd": {
      source: "iana",
      extensions: ["mcd"]
    },
    "application/vnd.medcalcdata": {
      source: "iana",
      extensions: ["mc1"]
    },
    "application/vnd.mediastation.cdkey": {
      source: "iana",
      extensions: ["cdkey"]
    },
    "application/vnd.meridian-slingshot": {
      source: "iana"
    },
    "application/vnd.mfer": {
      source: "iana",
      extensions: ["mwf"]
    },
    "application/vnd.mfmp": {
      source: "iana",
      extensions: ["mfm"]
    },
    "application/vnd.micro+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.micrografx.flo": {
      source: "iana",
      extensions: ["flo"]
    },
    "application/vnd.micrografx.igx": {
      source: "iana",
      extensions: ["igx"]
    },
    "application/vnd.microsoft.portable-executable": {
      source: "iana"
    },
    "application/vnd.microsoft.windows.thumbnail-cache": {
      source: "iana"
    },
    "application/vnd.miele+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.mif": {
      source: "iana",
      extensions: ["mif"]
    },
    "application/vnd.minisoft-hp3000-save": {
      source: "iana"
    },
    "application/vnd.mitsubishi.misty-guard.trustweb": {
      source: "iana"
    },
    "application/vnd.mobius.daf": {
      source: "iana",
      extensions: ["daf"]
    },
    "application/vnd.mobius.dis": {
      source: "iana",
      extensions: ["dis"]
    },
    "application/vnd.mobius.mbk": {
      source: "iana",
      extensions: ["mbk"]
    },
    "application/vnd.mobius.mqy": {
      source: "iana",
      extensions: ["mqy"]
    },
    "application/vnd.mobius.msl": {
      source: "iana",
      extensions: ["msl"]
    },
    "application/vnd.mobius.plc": {
      source: "iana",
      extensions: ["plc"]
    },
    "application/vnd.mobius.txf": {
      source: "iana",
      extensions: ["txf"]
    },
    "application/vnd.mophun.application": {
      source: "iana",
      extensions: ["mpn"]
    },
    "application/vnd.mophun.certificate": {
      source: "iana",
      extensions: ["mpc"]
    },
    "application/vnd.motorola.flexsuite": {
      source: "iana"
    },
    "application/vnd.motorola.flexsuite.adsi": {
      source: "iana"
    },
    "application/vnd.motorola.flexsuite.fis": {
      source: "iana"
    },
    "application/vnd.motorola.flexsuite.gotap": {
      source: "iana"
    },
    "application/vnd.motorola.flexsuite.kmr": {
      source: "iana"
    },
    "application/vnd.motorola.flexsuite.ttc": {
      source: "iana"
    },
    "application/vnd.motorola.flexsuite.wem": {
      source: "iana"
    },
    "application/vnd.motorola.iprm": {
      source: "iana"
    },
    "application/vnd.mozilla.xul+xml": {
      source: "iana",
      compressible: true,
      extensions: ["xul"]
    },
    "application/vnd.ms-3mfdocument": {
      source: "iana"
    },
    "application/vnd.ms-artgalry": {
      source: "iana",
      extensions: ["cil"]
    },
    "application/vnd.ms-asf": {
      source: "iana"
    },
    "application/vnd.ms-cab-compressed": {
      source: "iana",
      extensions: ["cab"]
    },
    "application/vnd.ms-color.iccprofile": {
      source: "apache"
    },
    "application/vnd.ms-excel": {
      source: "iana",
      compressible: false,
      extensions: ["xls", "xlm", "xla", "xlc", "xlt", "xlw"]
    },
    "application/vnd.ms-excel.addin.macroenabled.12": {
      source: "iana",
      extensions: ["xlam"]
    },
    "application/vnd.ms-excel.sheet.binary.macroenabled.12": {
      source: "iana",
      extensions: ["xlsb"]
    },
    "application/vnd.ms-excel.sheet.macroenabled.12": {
      source: "iana",
      extensions: ["xlsm"]
    },
    "application/vnd.ms-excel.template.macroenabled.12": {
      source: "iana",
      extensions: ["xltm"]
    },
    "application/vnd.ms-fontobject": {
      source: "iana",
      compressible: true,
      extensions: ["eot"]
    },
    "application/vnd.ms-htmlhelp": {
      source: "iana",
      extensions: ["chm"]
    },
    "application/vnd.ms-ims": {
      source: "iana",
      extensions: ["ims"]
    },
    "application/vnd.ms-lrm": {
      source: "iana",
      extensions: ["lrm"]
    },
    "application/vnd.ms-office.activex+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.ms-officetheme": {
      source: "iana",
      extensions: ["thmx"]
    },
    "application/vnd.ms-opentype": {
      source: "apache",
      compressible: true
    },
    "application/vnd.ms-outlook": {
      compressible: false,
      extensions: ["msg"]
    },
    "application/vnd.ms-package.obfuscated-opentype": {
      source: "apache"
    },
    "application/vnd.ms-pki.seccat": {
      source: "apache",
      extensions: ["cat"]
    },
    "application/vnd.ms-pki.stl": {
      source: "apache",
      extensions: ["stl"]
    },
    "application/vnd.ms-playready.initiator+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.ms-powerpoint": {
      source: "iana",
      compressible: false,
      extensions: ["ppt", "pps", "pot"]
    },
    "application/vnd.ms-powerpoint.addin.macroenabled.12": {
      source: "iana",
      extensions: ["ppam"]
    },
    "application/vnd.ms-powerpoint.presentation.macroenabled.12": {
      source: "iana",
      extensions: ["pptm"]
    },
    "application/vnd.ms-powerpoint.slide.macroenabled.12": {
      source: "iana",
      extensions: ["sldm"]
    },
    "application/vnd.ms-powerpoint.slideshow.macroenabled.12": {
      source: "iana",
      extensions: ["ppsm"]
    },
    "application/vnd.ms-powerpoint.template.macroenabled.12": {
      source: "iana",
      extensions: ["potm"]
    },
    "application/vnd.ms-printdevicecapabilities+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.ms-printing.printticket+xml": {
      source: "apache",
      compressible: true
    },
    "application/vnd.ms-printschematicket+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.ms-project": {
      source: "iana",
      extensions: ["mpp", "mpt"]
    },
    "application/vnd.ms-tnef": {
      source: "iana"
    },
    "application/vnd.ms-windows.devicepairing": {
      source: "iana"
    },
    "application/vnd.ms-windows.nwprinting.oob": {
      source: "iana"
    },
    "application/vnd.ms-windows.printerpairing": {
      source: "iana"
    },
    "application/vnd.ms-windows.wsd.oob": {
      source: "iana"
    },
    "application/vnd.ms-wmdrm.lic-chlg-req": {
      source: "iana"
    },
    "application/vnd.ms-wmdrm.lic-resp": {
      source: "iana"
    },
    "application/vnd.ms-wmdrm.meter-chlg-req": {
      source: "iana"
    },
    "application/vnd.ms-wmdrm.meter-resp": {
      source: "iana"
    },
    "application/vnd.ms-word.document.macroenabled.12": {
      source: "iana",
      extensions: ["docm"]
    },
    "application/vnd.ms-word.template.macroenabled.12": {
      source: "iana",
      extensions: ["dotm"]
    },
    "application/vnd.ms-works": {
      source: "iana",
      extensions: ["wps", "wks", "wcm", "wdb"]
    },
    "application/vnd.ms-wpl": {
      source: "iana",
      extensions: ["wpl"]
    },
    "application/vnd.ms-xpsdocument": {
      source: "iana",
      compressible: false,
      extensions: ["xps"]
    },
    "application/vnd.msa-disk-image": {
      source: "iana"
    },
    "application/vnd.mseq": {
      source: "iana",
      extensions: ["mseq"]
    },
    "application/vnd.msign": {
      source: "iana"
    },
    "application/vnd.multiad.creator": {
      source: "iana"
    },
    "application/vnd.multiad.creator.cif": {
      source: "iana"
    },
    "application/vnd.music-niff": {
      source: "iana"
    },
    "application/vnd.musician": {
      source: "iana",
      extensions: ["mus"]
    },
    "application/vnd.muvee.style": {
      source: "iana",
      extensions: ["msty"]
    },
    "application/vnd.mynfc": {
      source: "iana",
      extensions: ["taglet"]
    },
    "application/vnd.nacamar.ybrid+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.ncd.control": {
      source: "iana"
    },
    "application/vnd.ncd.reference": {
      source: "iana"
    },
    "application/vnd.nearst.inv+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.nebumind.line": {
      source: "iana"
    },
    "application/vnd.nervana": {
      source: "iana"
    },
    "application/vnd.netfpx": {
      source: "iana"
    },
    "application/vnd.neurolanguage.nlu": {
      source: "iana",
      extensions: ["nlu"]
    },
    "application/vnd.nimn": {
      source: "iana"
    },
    "application/vnd.nintendo.nitro.rom": {
      source: "iana"
    },
    "application/vnd.nintendo.snes.rom": {
      source: "iana"
    },
    "application/vnd.nitf": {
      source: "iana",
      extensions: ["ntf", "nitf"]
    },
    "application/vnd.noblenet-directory": {
      source: "iana",
      extensions: ["nnd"]
    },
    "application/vnd.noblenet-sealer": {
      source: "iana",
      extensions: ["nns"]
    },
    "application/vnd.noblenet-web": {
      source: "iana",
      extensions: ["nnw"]
    },
    "application/vnd.nokia.catalogs": {
      source: "iana"
    },
    "application/vnd.nokia.conml+wbxml": {
      source: "iana"
    },
    "application/vnd.nokia.conml+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.nokia.iptv.config+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.nokia.isds-radio-presets": {
      source: "iana"
    },
    "application/vnd.nokia.landmark+wbxml": {
      source: "iana"
    },
    "application/vnd.nokia.landmark+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.nokia.landmarkcollection+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.nokia.n-gage.ac+xml": {
      source: "iana",
      compressible: true,
      extensions: ["ac"]
    },
    "application/vnd.nokia.n-gage.data": {
      source: "iana",
      extensions: ["ngdat"]
    },
    "application/vnd.nokia.n-gage.symbian.install": {
      source: "iana",
      extensions: ["n-gage"]
    },
    "application/vnd.nokia.ncd": {
      source: "iana"
    },
    "application/vnd.nokia.pcd+wbxml": {
      source: "iana"
    },
    "application/vnd.nokia.pcd+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.nokia.radio-preset": {
      source: "iana",
      extensions: ["rpst"]
    },
    "application/vnd.nokia.radio-presets": {
      source: "iana",
      extensions: ["rpss"]
    },
    "application/vnd.novadigm.edm": {
      source: "iana",
      extensions: ["edm"]
    },
    "application/vnd.novadigm.edx": {
      source: "iana",
      extensions: ["edx"]
    },
    "application/vnd.novadigm.ext": {
      source: "iana",
      extensions: ["ext"]
    },
    "application/vnd.ntt-local.content-share": {
      source: "iana"
    },
    "application/vnd.ntt-local.file-transfer": {
      source: "iana"
    },
    "application/vnd.ntt-local.ogw_remote-access": {
      source: "iana"
    },
    "application/vnd.ntt-local.sip-ta_remote": {
      source: "iana"
    },
    "application/vnd.ntt-local.sip-ta_tcp_stream": {
      source: "iana"
    },
    "application/vnd.oasis.opendocument.chart": {
      source: "iana",
      extensions: ["odc"]
    },
    "application/vnd.oasis.opendocument.chart-template": {
      source: "iana",
      extensions: ["otc"]
    },
    "application/vnd.oasis.opendocument.database": {
      source: "iana",
      extensions: ["odb"]
    },
    "application/vnd.oasis.opendocument.formula": {
      source: "iana",
      extensions: ["odf"]
    },
    "application/vnd.oasis.opendocument.formula-template": {
      source: "iana",
      extensions: ["odft"]
    },
    "application/vnd.oasis.opendocument.graphics": {
      source: "iana",
      compressible: false,
      extensions: ["odg"]
    },
    "application/vnd.oasis.opendocument.graphics-template": {
      source: "iana",
      extensions: ["otg"]
    },
    "application/vnd.oasis.opendocument.image": {
      source: "iana",
      extensions: ["odi"]
    },
    "application/vnd.oasis.opendocument.image-template": {
      source: "iana",
      extensions: ["oti"]
    },
    "application/vnd.oasis.opendocument.presentation": {
      source: "iana",
      compressible: false,
      extensions: ["odp"]
    },
    "application/vnd.oasis.opendocument.presentation-template": {
      source: "iana",
      extensions: ["otp"]
    },
    "application/vnd.oasis.opendocument.spreadsheet": {
      source: "iana",
      compressible: false,
      extensions: ["ods"]
    },
    "application/vnd.oasis.opendocument.spreadsheet-template": {
      source: "iana",
      extensions: ["ots"]
    },
    "application/vnd.oasis.opendocument.text": {
      source: "iana",
      compressible: false,
      extensions: ["odt"]
    },
    "application/vnd.oasis.opendocument.text-master": {
      source: "iana",
      extensions: ["odm"]
    },
    "application/vnd.oasis.opendocument.text-template": {
      source: "iana",
      extensions: ["ott"]
    },
    "application/vnd.oasis.opendocument.text-web": {
      source: "iana",
      extensions: ["oth"]
    },
    "application/vnd.obn": {
      source: "iana"
    },
    "application/vnd.ocf+cbor": {
      source: "iana"
    },
    "application/vnd.oci.image.manifest.v1+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.oftn.l10n+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.oipf.contentaccessdownload+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.oipf.contentaccessstreaming+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.oipf.cspg-hexbinary": {
      source: "iana"
    },
    "application/vnd.oipf.dae.svg+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.oipf.dae.xhtml+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.oipf.mippvcontrolmessage+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.oipf.pae.gem": {
      source: "iana"
    },
    "application/vnd.oipf.spdiscovery+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.oipf.spdlist+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.oipf.ueprofile+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.oipf.userprofile+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.olpc-sugar": {
      source: "iana",
      extensions: ["xo"]
    },
    "application/vnd.oma-scws-config": {
      source: "iana"
    },
    "application/vnd.oma-scws-http-request": {
      source: "iana"
    },
    "application/vnd.oma-scws-http-response": {
      source: "iana"
    },
    "application/vnd.oma.bcast.associated-procedure-parameter+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.oma.bcast.drm-trigger+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.oma.bcast.imd+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.oma.bcast.ltkm": {
      source: "iana"
    },
    "application/vnd.oma.bcast.notification+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.oma.bcast.provisioningtrigger": {
      source: "iana"
    },
    "application/vnd.oma.bcast.sgboot": {
      source: "iana"
    },
    "application/vnd.oma.bcast.sgdd+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.oma.bcast.sgdu": {
      source: "iana"
    },
    "application/vnd.oma.bcast.simple-symbol-container": {
      source: "iana"
    },
    "application/vnd.oma.bcast.smartcard-trigger+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.oma.bcast.sprov+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.oma.bcast.stkm": {
      source: "iana"
    },
    "application/vnd.oma.cab-address-book+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.oma.cab-feature-handler+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.oma.cab-pcc+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.oma.cab-subs-invite+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.oma.cab-user-prefs+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.oma.dcd": {
      source: "iana"
    },
    "application/vnd.oma.dcdc": {
      source: "iana"
    },
    "application/vnd.oma.dd2+xml": {
      source: "iana",
      compressible: true,
      extensions: ["dd2"]
    },
    "application/vnd.oma.drm.risd+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.oma.group-usage-list+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.oma.lwm2m+cbor": {
      source: "iana"
    },
    "application/vnd.oma.lwm2m+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.oma.lwm2m+tlv": {
      source: "iana"
    },
    "application/vnd.oma.pal+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.oma.poc.detailed-progress-report+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.oma.poc.final-report+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.oma.poc.groups+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.oma.poc.invocation-descriptor+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.oma.poc.optimized-progress-report+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.oma.push": {
      source: "iana"
    },
    "application/vnd.oma.scidm.messages+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.oma.xcap-directory+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.omads-email+xml": {
      source: "iana",
      charset: "UTF-8",
      compressible: true
    },
    "application/vnd.omads-file+xml": {
      source: "iana",
      charset: "UTF-8",
      compressible: true
    },
    "application/vnd.omads-folder+xml": {
      source: "iana",
      charset: "UTF-8",
      compressible: true
    },
    "application/vnd.omaloc-supl-init": {
      source: "iana"
    },
    "application/vnd.onepager": {
      source: "iana"
    },
    "application/vnd.onepagertamp": {
      source: "iana"
    },
    "application/vnd.onepagertamx": {
      source: "iana"
    },
    "application/vnd.onepagertat": {
      source: "iana"
    },
    "application/vnd.onepagertatp": {
      source: "iana"
    },
    "application/vnd.onepagertatx": {
      source: "iana"
    },
    "application/vnd.openblox.game+xml": {
      source: "iana",
      compressible: true,
      extensions: ["obgx"]
    },
    "application/vnd.openblox.game-binary": {
      source: "iana"
    },
    "application/vnd.openeye.oeb": {
      source: "iana"
    },
    "application/vnd.openofficeorg.extension": {
      source: "apache",
      extensions: ["oxt"]
    },
    "application/vnd.openstreetmap.data+xml": {
      source: "iana",
      compressible: true,
      extensions: ["osm"]
    },
    "application/vnd.opentimestamps.ots": {
      source: "iana"
    },
    "application/vnd.openxmlformats-officedocument.custom-properties+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.customxmlproperties+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.drawing+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.drawingml.chart+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.drawingml.chartshapes+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.drawingml.diagramcolors+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.drawingml.diagramdata+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.drawingml.diagramlayout+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.drawingml.diagramstyle+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.extended-properties+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.presentationml.commentauthors+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.presentationml.comments+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.presentationml.handoutmaster+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.presentationml.notesmaster+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.presentationml.notesslide+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
      source: "iana",
      compressible: false,
      extensions: ["pptx"]
    },
    "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.presentationml.presprops+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.presentationml.slide": {
      source: "iana",
      extensions: ["sldx"]
    },
    "application/vnd.openxmlformats-officedocument.presentationml.slide+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.presentationml.slidelayout+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.presentationml.slidemaster+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.presentationml.slideshow": {
      source: "iana",
      extensions: ["ppsx"]
    },
    "application/vnd.openxmlformats-officedocument.presentationml.slideshow.main+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.presentationml.slideupdateinfo+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.presentationml.tablestyles+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.presentationml.tags+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.presentationml.template": {
      source: "iana",
      extensions: ["potx"]
    },
    "application/vnd.openxmlformats-officedocument.presentationml.template.main+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.presentationml.viewprops+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.calcchain+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.chartsheet+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.comments+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.connections+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.dialogsheet+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.externallink+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcachedefinition+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcacherecords+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.pivottable+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.querytable+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.revisionheaders+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.revisionlog+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sharedstrings+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
      source: "iana",
      compressible: false,
      extensions: ["xlsx"]
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheetmetadata+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.tablesinglecells+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.template": {
      source: "iana",
      extensions: ["xltx"]
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.template.main+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.usernames+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.volatiledependencies+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.theme+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.themeoverride+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.vmldrawing": {
      source: "iana"
    },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      source: "iana",
      compressible: false,
      extensions: ["docx"]
    },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document.glossary+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.endnotes+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.fonttable+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.template": {
      source: "iana",
      extensions: ["dotx"]
    },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.websettings+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-package.core-properties+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-package.digital-signature-xmlsignature+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.openxmlformats-package.relationships+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.oracle.resource+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.orange.indata": {
      source: "iana"
    },
    "application/vnd.osa.netdeploy": {
      source: "iana"
    },
    "application/vnd.osgeo.mapguide.package": {
      source: "iana",
      extensions: ["mgp"]
    },
    "application/vnd.osgi.bundle": {
      source: "iana"
    },
    "application/vnd.osgi.dp": {
      source: "iana",
      extensions: ["dp"]
    },
    "application/vnd.osgi.subsystem": {
      source: "iana",
      extensions: ["esa"]
    },
    "application/vnd.otps.ct-kip+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.oxli.countgraph": {
      source: "iana"
    },
    "application/vnd.pagerduty+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.palm": {
      source: "iana",
      extensions: ["pdb", "pqa", "oprc"]
    },
    "application/vnd.panoply": {
      source: "iana"
    },
    "application/vnd.paos.xml": {
      source: "iana"
    },
    "application/vnd.patentdive": {
      source: "iana"
    },
    "application/vnd.patientecommsdoc": {
      source: "iana"
    },
    "application/vnd.pawaafile": {
      source: "iana",
      extensions: ["paw"]
    },
    "application/vnd.pcos": {
      source: "iana"
    },
    "application/vnd.pg.format": {
      source: "iana",
      extensions: ["str"]
    },
    "application/vnd.pg.osasli": {
      source: "iana",
      extensions: ["ei6"]
    },
    "application/vnd.piaccess.application-licence": {
      source: "iana"
    },
    "application/vnd.picsel": {
      source: "iana",
      extensions: ["efif"]
    },
    "application/vnd.pmi.widget": {
      source: "iana",
      extensions: ["wg"]
    },
    "application/vnd.poc.group-advertisement+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.pocketlearn": {
      source: "iana",
      extensions: ["plf"]
    },
    "application/vnd.powerbuilder6": {
      source: "iana",
      extensions: ["pbd"]
    },
    "application/vnd.powerbuilder6-s": {
      source: "iana"
    },
    "application/vnd.powerbuilder7": {
      source: "iana"
    },
    "application/vnd.powerbuilder7-s": {
      source: "iana"
    },
    "application/vnd.powerbuilder75": {
      source: "iana"
    },
    "application/vnd.powerbuilder75-s": {
      source: "iana"
    },
    "application/vnd.preminet": {
      source: "iana"
    },
    "application/vnd.previewsystems.box": {
      source: "iana",
      extensions: ["box"]
    },
    "application/vnd.proteus.magazine": {
      source: "iana",
      extensions: ["mgz"]
    },
    "application/vnd.psfs": {
      source: "iana"
    },
    "application/vnd.publishare-delta-tree": {
      source: "iana",
      extensions: ["qps"]
    },
    "application/vnd.pvi.ptid1": {
      source: "iana",
      extensions: ["ptid"]
    },
    "application/vnd.pwg-multiplexed": {
      source: "iana"
    },
    "application/vnd.pwg-xhtml-print+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.qualcomm.brew-app-res": {
      source: "iana"
    },
    "application/vnd.quarantainenet": {
      source: "iana"
    },
    "application/vnd.quark.quarkxpress": {
      source: "iana",
      extensions: ["qxd", "qxt", "qwd", "qwt", "qxl", "qxb"]
    },
    "application/vnd.quobject-quoxdocument": {
      source: "iana"
    },
    "application/vnd.radisys.moml+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.radisys.msml+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.radisys.msml-audit+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.radisys.msml-audit-conf+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.radisys.msml-audit-conn+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.radisys.msml-audit-dialog+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.radisys.msml-audit-stream+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.radisys.msml-conf+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.radisys.msml-dialog+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.radisys.msml-dialog-base+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.radisys.msml-dialog-fax-detect+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.radisys.msml-dialog-fax-sendrecv+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.radisys.msml-dialog-group+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.radisys.msml-dialog-speech+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.radisys.msml-dialog-transform+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.rainstor.data": {
      source: "iana"
    },
    "application/vnd.rapid": {
      source: "iana"
    },
    "application/vnd.rar": {
      source: "iana",
      extensions: ["rar"]
    },
    "application/vnd.realvnc.bed": {
      source: "iana",
      extensions: ["bed"]
    },
    "application/vnd.recordare.musicxml": {
      source: "iana",
      extensions: ["mxl"]
    },
    "application/vnd.recordare.musicxml+xml": {
      source: "iana",
      compressible: true,
      extensions: ["musicxml"]
    },
    "application/vnd.renlearn.rlprint": {
      source: "iana"
    },
    "application/vnd.resilient.logic": {
      source: "iana"
    },
    "application/vnd.restful+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.rig.cryptonote": {
      source: "iana",
      extensions: ["cryptonote"]
    },
    "application/vnd.rim.cod": {
      source: "apache",
      extensions: ["cod"]
    },
    "application/vnd.rn-realmedia": {
      source: "apache",
      extensions: ["rm"]
    },
    "application/vnd.rn-realmedia-vbr": {
      source: "apache",
      extensions: ["rmvb"]
    },
    "application/vnd.route66.link66+xml": {
      source: "iana",
      compressible: true,
      extensions: ["link66"]
    },
    "application/vnd.rs-274x": {
      source: "iana"
    },
    "application/vnd.ruckus.download": {
      source: "iana"
    },
    "application/vnd.s3sms": {
      source: "iana"
    },
    "application/vnd.sailingtracker.track": {
      source: "iana",
      extensions: ["st"]
    },
    "application/vnd.sar": {
      source: "iana"
    },
    "application/vnd.sbm.cid": {
      source: "iana"
    },
    "application/vnd.sbm.mid2": {
      source: "iana"
    },
    "application/vnd.scribus": {
      source: "iana"
    },
    "application/vnd.sealed.3df": {
      source: "iana"
    },
    "application/vnd.sealed.csf": {
      source: "iana"
    },
    "application/vnd.sealed.doc": {
      source: "iana"
    },
    "application/vnd.sealed.eml": {
      source: "iana"
    },
    "application/vnd.sealed.mht": {
      source: "iana"
    },
    "application/vnd.sealed.net": {
      source: "iana"
    },
    "application/vnd.sealed.ppt": {
      source: "iana"
    },
    "application/vnd.sealed.tiff": {
      source: "iana"
    },
    "application/vnd.sealed.xls": {
      source: "iana"
    },
    "application/vnd.sealedmedia.softseal.html": {
      source: "iana"
    },
    "application/vnd.sealedmedia.softseal.pdf": {
      source: "iana"
    },
    "application/vnd.seemail": {
      source: "iana",
      extensions: ["see"]
    },
    "application/vnd.seis+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.sema": {
      source: "iana",
      extensions: ["sema"]
    },
    "application/vnd.semd": {
      source: "iana",
      extensions: ["semd"]
    },
    "application/vnd.semf": {
      source: "iana",
      extensions: ["semf"]
    },
    "application/vnd.shade-save-file": {
      source: "iana"
    },
    "application/vnd.shana.informed.formdata": {
      source: "iana",
      extensions: ["ifm"]
    },
    "application/vnd.shana.informed.formtemplate": {
      source: "iana",
      extensions: ["itp"]
    },
    "application/vnd.shana.informed.interchange": {
      source: "iana",
      extensions: ["iif"]
    },
    "application/vnd.shana.informed.package": {
      source: "iana",
      extensions: ["ipk"]
    },
    "application/vnd.shootproof+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.shopkick+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.shp": {
      source: "iana"
    },
    "application/vnd.shx": {
      source: "iana"
    },
    "application/vnd.sigrok.session": {
      source: "iana"
    },
    "application/vnd.simtech-mindmapper": {
      source: "iana",
      extensions: ["twd", "twds"]
    },
    "application/vnd.siren+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.smaf": {
      source: "iana",
      extensions: ["mmf"]
    },
    "application/vnd.smart.notebook": {
      source: "iana"
    },
    "application/vnd.smart.teacher": {
      source: "iana",
      extensions: ["teacher"]
    },
    "application/vnd.snesdev-page-table": {
      source: "iana"
    },
    "application/vnd.software602.filler.form+xml": {
      source: "iana",
      compressible: true,
      extensions: ["fo"]
    },
    "application/vnd.software602.filler.form-xml-zip": {
      source: "iana"
    },
    "application/vnd.solent.sdkm+xml": {
      source: "iana",
      compressible: true,
      extensions: ["sdkm", "sdkd"]
    },
    "application/vnd.spotfire.dxp": {
      source: "iana",
      extensions: ["dxp"]
    },
    "application/vnd.spotfire.sfs": {
      source: "iana",
      extensions: ["sfs"]
    },
    "application/vnd.sqlite3": {
      source: "iana"
    },
    "application/vnd.sss-cod": {
      source: "iana"
    },
    "application/vnd.sss-dtf": {
      source: "iana"
    },
    "application/vnd.sss-ntf": {
      source: "iana"
    },
    "application/vnd.stardivision.calc": {
      source: "apache",
      extensions: ["sdc"]
    },
    "application/vnd.stardivision.draw": {
      source: "apache",
      extensions: ["sda"]
    },
    "application/vnd.stardivision.impress": {
      source: "apache",
      extensions: ["sdd"]
    },
    "application/vnd.stardivision.math": {
      source: "apache",
      extensions: ["smf"]
    },
    "application/vnd.stardivision.writer": {
      source: "apache",
      extensions: ["sdw", "vor"]
    },
    "application/vnd.stardivision.writer-global": {
      source: "apache",
      extensions: ["sgl"]
    },
    "application/vnd.stepmania.package": {
      source: "iana",
      extensions: ["smzip"]
    },
    "application/vnd.stepmania.stepchart": {
      source: "iana",
      extensions: ["sm"]
    },
    "application/vnd.street-stream": {
      source: "iana"
    },
    "application/vnd.sun.wadl+xml": {
      source: "iana",
      compressible: true,
      extensions: ["wadl"]
    },
    "application/vnd.sun.xml.calc": {
      source: "apache",
      extensions: ["sxc"]
    },
    "application/vnd.sun.xml.calc.template": {
      source: "apache",
      extensions: ["stc"]
    },
    "application/vnd.sun.xml.draw": {
      source: "apache",
      extensions: ["sxd"]
    },
    "application/vnd.sun.xml.draw.template": {
      source: "apache",
      extensions: ["std"]
    },
    "application/vnd.sun.xml.impress": {
      source: "apache",
      extensions: ["sxi"]
    },
    "application/vnd.sun.xml.impress.template": {
      source: "apache",
      extensions: ["sti"]
    },
    "application/vnd.sun.xml.math": {
      source: "apache",
      extensions: ["sxm"]
    },
    "application/vnd.sun.xml.writer": {
      source: "apache",
      extensions: ["sxw"]
    },
    "application/vnd.sun.xml.writer.global": {
      source: "apache",
      extensions: ["sxg"]
    },
    "application/vnd.sun.xml.writer.template": {
      source: "apache",
      extensions: ["stw"]
    },
    "application/vnd.sus-calendar": {
      source: "iana",
      extensions: ["sus", "susp"]
    },
    "application/vnd.svd": {
      source: "iana",
      extensions: ["svd"]
    },
    "application/vnd.swiftview-ics": {
      source: "iana"
    },
    "application/vnd.sycle+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.syft+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.symbian.install": {
      source: "apache",
      extensions: ["sis", "sisx"]
    },
    "application/vnd.syncml+xml": {
      source: "iana",
      charset: "UTF-8",
      compressible: true,
      extensions: ["xsm"]
    },
    "application/vnd.syncml.dm+wbxml": {
      source: "iana",
      charset: "UTF-8",
      extensions: ["bdm"]
    },
    "application/vnd.syncml.dm+xml": {
      source: "iana",
      charset: "UTF-8",
      compressible: true,
      extensions: ["xdm"]
    },
    "application/vnd.syncml.dm.notification": {
      source: "iana"
    },
    "application/vnd.syncml.dmddf+wbxml": {
      source: "iana"
    },
    "application/vnd.syncml.dmddf+xml": {
      source: "iana",
      charset: "UTF-8",
      compressible: true,
      extensions: ["ddf"]
    },
    "application/vnd.syncml.dmtnds+wbxml": {
      source: "iana"
    },
    "application/vnd.syncml.dmtnds+xml": {
      source: "iana",
      charset: "UTF-8",
      compressible: true
    },
    "application/vnd.syncml.ds.notification": {
      source: "iana"
    },
    "application/vnd.tableschema+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.tao.intent-module-archive": {
      source: "iana",
      extensions: ["tao"]
    },
    "application/vnd.tcpdump.pcap": {
      source: "iana",
      extensions: ["pcap", "cap", "dmp"]
    },
    "application/vnd.think-cell.ppttc+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.tmd.mediaflex.api+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.tml": {
      source: "iana"
    },
    "application/vnd.tmobile-livetv": {
      source: "iana",
      extensions: ["tmo"]
    },
    "application/vnd.tri.onesource": {
      source: "iana"
    },
    "application/vnd.trid.tpt": {
      source: "iana",
      extensions: ["tpt"]
    },
    "application/vnd.triscape.mxs": {
      source: "iana",
      extensions: ["mxs"]
    },
    "application/vnd.trueapp": {
      source: "iana",
      extensions: ["tra"]
    },
    "application/vnd.truedoc": {
      source: "iana"
    },
    "application/vnd.ubisoft.webplayer": {
      source: "iana"
    },
    "application/vnd.ufdl": {
      source: "iana",
      extensions: ["ufd", "ufdl"]
    },
    "application/vnd.uiq.theme": {
      source: "iana",
      extensions: ["utz"]
    },
    "application/vnd.umajin": {
      source: "iana",
      extensions: ["umj"]
    },
    "application/vnd.unity": {
      source: "iana",
      extensions: ["unityweb"]
    },
    "application/vnd.uoml+xml": {
      source: "iana",
      compressible: true,
      extensions: ["uoml"]
    },
    "application/vnd.uplanet.alert": {
      source: "iana"
    },
    "application/vnd.uplanet.alert-wbxml": {
      source: "iana"
    },
    "application/vnd.uplanet.bearer-choice": {
      source: "iana"
    },
    "application/vnd.uplanet.bearer-choice-wbxml": {
      source: "iana"
    },
    "application/vnd.uplanet.cacheop": {
      source: "iana"
    },
    "application/vnd.uplanet.cacheop-wbxml": {
      source: "iana"
    },
    "application/vnd.uplanet.channel": {
      source: "iana"
    },
    "application/vnd.uplanet.channel-wbxml": {
      source: "iana"
    },
    "application/vnd.uplanet.list": {
      source: "iana"
    },
    "application/vnd.uplanet.list-wbxml": {
      source: "iana"
    },
    "application/vnd.uplanet.listcmd": {
      source: "iana"
    },
    "application/vnd.uplanet.listcmd-wbxml": {
      source: "iana"
    },
    "application/vnd.uplanet.signal": {
      source: "iana"
    },
    "application/vnd.uri-map": {
      source: "iana"
    },
    "application/vnd.valve.source.material": {
      source: "iana"
    },
    "application/vnd.vcx": {
      source: "iana",
      extensions: ["vcx"]
    },
    "application/vnd.vd-study": {
      source: "iana"
    },
    "application/vnd.vectorworks": {
      source: "iana"
    },
    "application/vnd.vel+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.verimatrix.vcas": {
      source: "iana"
    },
    "application/vnd.veritone.aion+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.veryant.thin": {
      source: "iana"
    },
    "application/vnd.ves.encrypted": {
      source: "iana"
    },
    "application/vnd.vidsoft.vidconference": {
      source: "iana"
    },
    "application/vnd.visio": {
      source: "iana",
      extensions: ["vsd", "vst", "vss", "vsw"]
    },
    "application/vnd.visionary": {
      source: "iana",
      extensions: ["vis"]
    },
    "application/vnd.vividence.scriptfile": {
      source: "iana"
    },
    "application/vnd.vsf": {
      source: "iana",
      extensions: ["vsf"]
    },
    "application/vnd.wap.sic": {
      source: "iana"
    },
    "application/vnd.wap.slc": {
      source: "iana"
    },
    "application/vnd.wap.wbxml": {
      source: "iana",
      charset: "UTF-8",
      extensions: ["wbxml"]
    },
    "application/vnd.wap.wmlc": {
      source: "iana",
      extensions: ["wmlc"]
    },
    "application/vnd.wap.wmlscriptc": {
      source: "iana",
      extensions: ["wmlsc"]
    },
    "application/vnd.webturbo": {
      source: "iana",
      extensions: ["wtb"]
    },
    "application/vnd.wfa.dpp": {
      source: "iana"
    },
    "application/vnd.wfa.p2p": {
      source: "iana"
    },
    "application/vnd.wfa.wsc": {
      source: "iana"
    },
    "application/vnd.windows.devicepairing": {
      source: "iana"
    },
    "application/vnd.wmc": {
      source: "iana"
    },
    "application/vnd.wmf.bootstrap": {
      source: "iana"
    },
    "application/vnd.wolfram.mathematica": {
      source: "iana"
    },
    "application/vnd.wolfram.mathematica.package": {
      source: "iana"
    },
    "application/vnd.wolfram.player": {
      source: "iana",
      extensions: ["nbp"]
    },
    "application/vnd.wordperfect": {
      source: "iana",
      extensions: ["wpd"]
    },
    "application/vnd.wqd": {
      source: "iana",
      extensions: ["wqd"]
    },
    "application/vnd.wrq-hp3000-labelled": {
      source: "iana"
    },
    "application/vnd.wt.stf": {
      source: "iana",
      extensions: ["stf"]
    },
    "application/vnd.wv.csp+wbxml": {
      source: "iana"
    },
    "application/vnd.wv.csp+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.wv.ssp+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.xacml+json": {
      source: "iana",
      compressible: true
    },
    "application/vnd.xara": {
      source: "iana",
      extensions: ["xar"]
    },
    "application/vnd.xfdl": {
      source: "iana",
      extensions: ["xfdl"]
    },
    "application/vnd.xfdl.webform": {
      source: "iana"
    },
    "application/vnd.xmi+xml": {
      source: "iana",
      compressible: true
    },
    "application/vnd.xmpie.cpkg": {
      source: "iana"
    },
    "application/vnd.xmpie.dpkg": {
      source: "iana"
    },
    "application/vnd.xmpie.plan": {
      source: "iana"
    },
    "application/vnd.xmpie.ppkg": {
      source: "iana"
    },
    "application/vnd.xmpie.xlim": {
      source: "iana"
    },
    "application/vnd.yamaha.hv-dic": {
      source: "iana",
      extensions: ["hvd"]
    },
    "application/vnd.yamaha.hv-script": {
      source: "iana",
      extensions: ["hvs"]
    },
    "application/vnd.yamaha.hv-voice": {
      source: "iana",
      extensions: ["hvp"]
    },
    "application/vnd.yamaha.openscoreformat": {
      source: "iana",
      extensions: ["osf"]
    },
    "application/vnd.yamaha.openscoreformat.osfpvg+xml": {
      source: "iana",
      compressible: true,
      extensions: ["osfpvg"]
    },
    "application/vnd.yamaha.remote-setup": {
      source: "iana"
    },
    "application/vnd.yamaha.smaf-audio": {
      source: "iana",
      extensions: ["saf"]
    },
    "application/vnd.yamaha.smaf-phrase": {
      source: "iana",
      extensions: ["spf"]
    },
    "application/vnd.yamaha.through-ngn": {
      source: "iana"
    },
    "application/vnd.yamaha.tunnel-udpencap": {
      source: "iana"
    },
    "application/vnd.yaoweme": {
      source: "iana"
    },
    "application/vnd.yellowriver-custom-menu": {
      source: "iana",
      extensions: ["cmp"]
    },
    "application/vnd.youtube.yt": {
      source: "iana"
    },
    "application/vnd.zul": {
      source: "iana",
      extensions: ["zir", "zirz"]
    },
    "application/vnd.zzazz.deck+xml": {
      source: "iana",
      compressible: true,
      extensions: ["zaz"]
    },
    "application/voicexml+xml": {
      source: "iana",
      compressible: true,
      extensions: ["vxml"]
    },
    "application/voucher-cms+json": {
      source: "iana",
      compressible: true
    },
    "application/vq-rtcpxr": {
      source: "iana"
    },
    "application/wasm": {
      source: "iana",
      compressible: true,
      extensions: ["wasm"]
    },
    "application/watcherinfo+xml": {
      source: "iana",
      compressible: true,
      extensions: ["wif"]
    },
    "application/webpush-options+json": {
      source: "iana",
      compressible: true
    },
    "application/whoispp-query": {
      source: "iana"
    },
    "application/whoispp-response": {
      source: "iana"
    },
    "application/widget": {
      source: "iana",
      extensions: ["wgt"]
    },
    "application/winhlp": {
      source: "apache",
      extensions: ["hlp"]
    },
    "application/wita": {
      source: "iana"
    },
    "application/wordperfect5.1": {
      source: "iana"
    },
    "application/wsdl+xml": {
      source: "iana",
      compressible: true,
      extensions: ["wsdl"]
    },
    "application/wspolicy+xml": {
      source: "iana",
      compressible: true,
      extensions: ["wspolicy"]
    },
    "application/x-7z-compressed": {
      source: "apache",
      compressible: false,
      extensions: ["7z"]
    },
    "application/x-abiword": {
      source: "apache",
      extensions: ["abw"]
    },
    "application/x-ace-compressed": {
      source: "apache",
      extensions: ["ace"]
    },
    "application/x-amf": {
      source: "apache"
    },
    "application/x-apple-diskimage": {
      source: "apache",
      extensions: ["dmg"]
    },
    "application/x-arj": {
      compressible: false,
      extensions: ["arj"]
    },
    "application/x-authorware-bin": {
      source: "apache",
      extensions: ["aab", "x32", "u32", "vox"]
    },
    "application/x-authorware-map": {
      source: "apache",
      extensions: ["aam"]
    },
    "application/x-authorware-seg": {
      source: "apache",
      extensions: ["aas"]
    },
    "application/x-bcpio": {
      source: "apache",
      extensions: ["bcpio"]
    },
    "application/x-bdoc": {
      compressible: false,
      extensions: ["bdoc"]
    },
    "application/x-bittorrent": {
      source: "apache",
      extensions: ["torrent"]
    },
    "application/x-blorb": {
      source: "apache",
      extensions: ["blb", "blorb"]
    },
    "application/x-bzip": {
      source: "apache",
      compressible: false,
      extensions: ["bz"]
    },
    "application/x-bzip2": {
      source: "apache",
      compressible: false,
      extensions: ["bz2", "boz"]
    },
    "application/x-cbr": {
      source: "apache",
      extensions: ["cbr", "cba", "cbt", "cbz", "cb7"]
    },
    "application/x-cdlink": {
      source: "apache",
      extensions: ["vcd"]
    },
    "application/x-cfs-compressed": {
      source: "apache",
      extensions: ["cfs"]
    },
    "application/x-chat": {
      source: "apache",
      extensions: ["chat"]
    },
    "application/x-chess-pgn": {
      source: "apache",
      extensions: ["pgn"]
    },
    "application/x-chrome-extension": {
      extensions: ["crx"]
    },
    "application/x-cocoa": {
      source: "nginx",
      extensions: ["cco"]
    },
    "application/x-compress": {
      source: "apache"
    },
    "application/x-conference": {
      source: "apache",
      extensions: ["nsc"]
    },
    "application/x-cpio": {
      source: "apache",
      extensions: ["cpio"]
    },
    "application/x-csh": {
      source: "apache",
      extensions: ["csh"]
    },
    "application/x-deb": {
      compressible: false
    },
    "application/x-debian-package": {
      source: "apache",
      extensions: ["deb", "udeb"]
    },
    "application/x-dgc-compressed": {
      source: "apache",
      extensions: ["dgc"]
    },
    "application/x-director": {
      source: "apache",
      extensions: ["dir", "dcr", "dxr", "cst", "cct", "cxt", "w3d", "fgd", "swa"]
    },
    "application/x-doom": {
      source: "apache",
      extensions: ["wad"]
    },
    "application/x-dtbncx+xml": {
      source: "apache",
      compressible: true,
      extensions: ["ncx"]
    },
    "application/x-dtbook+xml": {
      source: "apache",
      compressible: true,
      extensions: ["dtb"]
    },
    "application/x-dtbresource+xml": {
      source: "apache",
      compressible: true,
      extensions: ["res"]
    },
    "application/x-dvi": {
      source: "apache",
      compressible: false,
      extensions: ["dvi"]
    },
    "application/x-envoy": {
      source: "apache",
      extensions: ["evy"]
    },
    "application/x-eva": {
      source: "apache",
      extensions: ["eva"]
    },
    "application/x-font-bdf": {
      source: "apache",
      extensions: ["bdf"]
    },
    "application/x-font-dos": {
      source: "apache"
    },
    "application/x-font-framemaker": {
      source: "apache"
    },
    "application/x-font-ghostscript": {
      source: "apache",
      extensions: ["gsf"]
    },
    "application/x-font-libgrx": {
      source: "apache"
    },
    "application/x-font-linux-psf": {
      source: "apache",
      extensions: ["psf"]
    },
    "application/x-font-pcf": {
      source: "apache",
      extensions: ["pcf"]
    },
    "application/x-font-snf": {
      source: "apache",
      extensions: ["snf"]
    },
    "application/x-font-speedo": {
      source: "apache"
    },
    "application/x-font-sunos-news": {
      source: "apache"
    },
    "application/x-font-type1": {
      source: "apache",
      extensions: ["pfa", "pfb", "pfm", "afm"]
    },
    "application/x-font-vfont": {
      source: "apache"
    },
    "application/x-freearc": {
      source: "apache",
      extensions: ["arc"]
    },
    "application/x-futuresplash": {
      source: "apache",
      extensions: ["spl"]
    },
    "application/x-gca-compressed": {
      source: "apache",
      extensions: ["gca"]
    },
    "application/x-glulx": {
      source: "apache",
      extensions: ["ulx"]
    },
    "application/x-gnumeric": {
      source: "apache",
      extensions: ["gnumeric"]
    },
    "application/x-gramps-xml": {
      source: "apache",
      extensions: ["gramps"]
    },
    "application/x-gtar": {
      source: "apache",
      extensions: ["gtar"]
    },
    "application/x-gzip": {
      source: "apache"
    },
    "application/x-hdf": {
      source: "apache",
      extensions: ["hdf"]
    },
    "application/x-httpd-php": {
      compressible: true,
      extensions: ["php"]
    },
    "application/x-install-instructions": {
      source: "apache",
      extensions: ["install"]
    },
    "application/x-iso9660-image": {
      source: "apache",
      extensions: ["iso"]
    },
    "application/x-iwork-keynote-sffkey": {
      extensions: ["key"]
    },
    "application/x-iwork-numbers-sffnumbers": {
      extensions: ["numbers"]
    },
    "application/x-iwork-pages-sffpages": {
      extensions: ["pages"]
    },
    "application/x-java-archive-diff": {
      source: "nginx",
      extensions: ["jardiff"]
    },
    "application/x-java-jnlp-file": {
      source: "apache",
      compressible: false,
      extensions: ["jnlp"]
    },
    "application/x-javascript": {
      compressible: true
    },
    "application/x-keepass2": {
      extensions: ["kdbx"]
    },
    "application/x-latex": {
      source: "apache",
      compressible: false,
      extensions: ["latex"]
    },
    "application/x-lua-bytecode": {
      extensions: ["luac"]
    },
    "application/x-lzh-compressed": {
      source: "apache",
      extensions: ["lzh", "lha"]
    },
    "application/x-makeself": {
      source: "nginx",
      extensions: ["run"]
    },
    "application/x-mie": {
      source: "apache",
      extensions: ["mie"]
    },
    "application/x-mobipocket-ebook": {
      source: "apache",
      extensions: ["prc", "mobi"]
    },
    "application/x-mpegurl": {
      compressible: false
    },
    "application/x-ms-application": {
      source: "apache",
      extensions: ["application"]
    },
    "application/x-ms-shortcut": {
      source: "apache",
      extensions: ["lnk"]
    },
    "application/x-ms-wmd": {
      source: "apache",
      extensions: ["wmd"]
    },
    "application/x-ms-wmz": {
      source: "apache",
      extensions: ["wmz"]
    },
    "application/x-ms-xbap": {
      source: "apache",
      extensions: ["xbap"]
    },
    "application/x-msaccess": {
      source: "apache",
      extensions: ["mdb"]
    },
    "application/x-msbinder": {
      source: "apache",
      extensions: ["obd"]
    },
    "application/x-mscardfile": {
      source: "apache",
      extensions: ["crd"]
    },
    "application/x-msclip": {
      source: "apache",
      extensions: ["clp"]
    },
    "application/x-msdos-program": {
      extensions: ["exe"]
    },
    "application/x-msdownload": {
      source: "apache",
      extensions: ["exe", "dll", "com", "bat", "msi"]
    },
    "application/x-msmediaview": {
      source: "apache",
      extensions: ["mvb", "m13", "m14"]
    },
    "application/x-msmetafile": {
      source: "apache",
      extensions: ["wmf", "wmz", "emf", "emz"]
    },
    "application/x-msmoney": {
      source: "apache",
      extensions: ["mny"]
    },
    "application/x-mspublisher": {
      source: "apache",
      extensions: ["pub"]
    },
    "application/x-msschedule": {
      source: "apache",
      extensions: ["scd"]
    },
    "application/x-msterminal": {
      source: "apache",
      extensions: ["trm"]
    },
    "application/x-mswrite": {
      source: "apache",
      extensions: ["wri"]
    },
    "application/x-netcdf": {
      source: "apache",
      extensions: ["nc", "cdf"]
    },
    "application/x-ns-proxy-autoconfig": {
      compressible: true,
      extensions: ["pac"]
    },
    "application/x-nzb": {
      source: "apache",
      extensions: ["nzb"]
    },
    "application/x-perl": {
      source: "nginx",
      extensions: ["pl", "pm"]
    },
    "application/x-pilot": {
      source: "nginx",
      extensions: ["prc", "pdb"]
    },
    "application/x-pkcs12": {
      source: "apache",
      compressible: false,
      extensions: ["p12", "pfx"]
    },
    "application/x-pkcs7-certificates": {
      source: "apache",
      extensions: ["p7b", "spc"]
    },
    "application/x-pkcs7-certreqresp": {
      source: "apache",
      extensions: ["p7r"]
    },
    "application/x-pki-message": {
      source: "iana"
    },
    "application/x-rar-compressed": {
      source: "apache",
      compressible: false,
      extensions: ["rar"]
    },
    "application/x-redhat-package-manager": {
      source: "nginx",
      extensions: ["rpm"]
    },
    "application/x-research-info-systems": {
      source: "apache",
      extensions: ["ris"]
    },
    "application/x-sea": {
      source: "nginx",
      extensions: ["sea"]
    },
    "application/x-sh": {
      source: "apache",
      compressible: true,
      extensions: ["sh"]
    },
    "application/x-shar": {
      source: "apache",
      extensions: ["shar"]
    },
    "application/x-shockwave-flash": {
      source: "apache",
      compressible: false,
      extensions: ["swf"]
    },
    "application/x-silverlight-app": {
      source: "apache",
      extensions: ["xap"]
    },
    "application/x-sql": {
      source: "apache",
      extensions: ["sql"]
    },
    "application/x-stuffit": {
      source: "apache",
      compressible: false,
      extensions: ["sit"]
    },
    "application/x-stuffitx": {
      source: "apache",
      extensions: ["sitx"]
    },
    "application/x-subrip": {
      source: "apache",
      extensions: ["srt"]
    },
    "application/x-sv4cpio": {
      source: "apache",
      extensions: ["sv4cpio"]
    },
    "application/x-sv4crc": {
      source: "apache",
      extensions: ["sv4crc"]
    },
    "application/x-t3vm-image": {
      source: "apache",
      extensions: ["t3"]
    },
    "application/x-tads": {
      source: "apache",
      extensions: ["gam"]
    },
    "application/x-tar": {
      source: "apache",
      compressible: true,
      extensions: ["tar"]
    },
    "application/x-tcl": {
      source: "apache",
      extensions: ["tcl", "tk"]
    },
    "application/x-tex": {
      source: "apache",
      extensions: ["tex"]
    },
    "application/x-tex-tfm": {
      source: "apache",
      extensions: ["tfm"]
    },
    "application/x-texinfo": {
      source: "apache",
      extensions: ["texinfo", "texi"]
    },
    "application/x-tgif": {
      source: "apache",
      extensions: ["obj"]
    },
    "application/x-ustar": {
      source: "apache",
      extensions: ["ustar"]
    },
    "application/x-virtualbox-hdd": {
      compressible: true,
      extensions: ["hdd"]
    },
    "application/x-virtualbox-ova": {
      compressible: true,
      extensions: ["ova"]
    },
    "application/x-virtualbox-ovf": {
      compressible: true,
      extensions: ["ovf"]
    },
    "application/x-virtualbox-vbox": {
      compressible: true,
      extensions: ["vbox"]
    },
    "application/x-virtualbox-vbox-extpack": {
      compressible: false,
      extensions: ["vbox-extpack"]
    },
    "application/x-virtualbox-vdi": {
      compressible: true,
      extensions: ["vdi"]
    },
    "application/x-virtualbox-vhd": {
      compressible: true,
      extensions: ["vhd"]
    },
    "application/x-virtualbox-vmdk": {
      compressible: true,
      extensions: ["vmdk"]
    },
    "application/x-wais-source": {
      source: "apache",
      extensions: ["src"]
    },
    "application/x-web-app-manifest+json": {
      compressible: true,
      extensions: ["webapp"]
    },
    "application/x-www-form-urlencoded": {
      source: "iana",
      compressible: true
    },
    "application/x-x509-ca-cert": {
      source: "iana",
      extensions: ["der", "crt", "pem"]
    },
    "application/x-x509-ca-ra-cert": {
      source: "iana"
    },
    "application/x-x509-next-ca-cert": {
      source: "iana"
    },
    "application/x-xfig": {
      source: "apache",
      extensions: ["fig"]
    },
    "application/x-xliff+xml": {
      source: "apache",
      compressible: true,
      extensions: ["xlf"]
    },
    "application/x-xpinstall": {
      source: "apache",
      compressible: false,
      extensions: ["xpi"]
    },
    "application/x-xz": {
      source: "apache",
      extensions: ["xz"]
    },
    "application/x-zmachine": {
      source: "apache",
      extensions: ["z1", "z2", "z3", "z4", "z5", "z6", "z7", "z8"]
    },
    "application/x400-bp": {
      source: "iana"
    },
    "application/xacml+xml": {
      source: "iana",
      compressible: true
    },
    "application/xaml+xml": {
      source: "apache",
      compressible: true,
      extensions: ["xaml"]
    },
    "application/xcap-att+xml": {
      source: "iana",
      compressible: true,
      extensions: ["xav"]
    },
    "application/xcap-caps+xml": {
      source: "iana",
      compressible: true,
      extensions: ["xca"]
    },
    "application/xcap-diff+xml": {
      source: "iana",
      compressible: true,
      extensions: ["xdf"]
    },
    "application/xcap-el+xml": {
      source: "iana",
      compressible: true,
      extensions: ["xel"]
    },
    "application/xcap-error+xml": {
      source: "iana",
      compressible: true
    },
    "application/xcap-ns+xml": {
      source: "iana",
      compressible: true,
      extensions: ["xns"]
    },
    "application/xcon-conference-info+xml": {
      source: "iana",
      compressible: true
    },
    "application/xcon-conference-info-diff+xml": {
      source: "iana",
      compressible: true
    },
    "application/xenc+xml": {
      source: "iana",
      compressible: true,
      extensions: ["xenc"]
    },
    "application/xhtml+xml": {
      source: "iana",
      compressible: true,
      extensions: ["xhtml", "xht"]
    },
    "application/xhtml-voice+xml": {
      source: "apache",
      compressible: true
    },
    "application/xliff+xml": {
      source: "iana",
      compressible: true,
      extensions: ["xlf"]
    },
    "application/xml": {
      source: "iana",
      compressible: true,
      extensions: ["xml", "xsl", "xsd", "rng"]
    },
    "application/xml-dtd": {
      source: "iana",
      compressible: true,
      extensions: ["dtd"]
    },
    "application/xml-external-parsed-entity": {
      source: "iana"
    },
    "application/xml-patch+xml": {
      source: "iana",
      compressible: true
    },
    "application/xmpp+xml": {
      source: "iana",
      compressible: true
    },
    "application/xop+xml": {
      source: "iana",
      compressible: true,
      extensions: ["xop"]
    },
    "application/xproc+xml": {
      source: "apache",
      compressible: true,
      extensions: ["xpl"]
    },
    "application/xslt+xml": {
      source: "iana",
      compressible: true,
      extensions: ["xsl", "xslt"]
    },
    "application/xspf+xml": {
      source: "apache",
      compressible: true,
      extensions: ["xspf"]
    },
    "application/xv+xml": {
      source: "iana",
      compressible: true,
      extensions: ["mxml", "xhvml", "xvml", "xvm"]
    },
    "application/yang": {
      source: "iana",
      extensions: ["yang"]
    },
    "application/yang-data+json": {
      source: "iana",
      compressible: true
    },
    "application/yang-data+xml": {
      source: "iana",
      compressible: true
    },
    "application/yang-patch+json": {
      source: "iana",
      compressible: true
    },
    "application/yang-patch+xml": {
      source: "iana",
      compressible: true
    },
    "application/yin+xml": {
      source: "iana",
      compressible: true,
      extensions: ["yin"]
    },
    "application/zip": {
      source: "iana",
      compressible: false,
      extensions: ["zip"]
    },
    "application/zlib": {
      source: "iana"
    },
    "application/zstd": {
      source: "iana"
    },
    "audio/1d-interleaved-parityfec": {
      source: "iana"
    },
    "audio/32kadpcm": {
      source: "iana"
    },
    "audio/3gpp": {
      source: "iana",
      compressible: false,
      extensions: ["3gpp"]
    },
    "audio/3gpp2": {
      source: "iana"
    },
    "audio/aac": {
      source: "iana"
    },
    "audio/ac3": {
      source: "iana"
    },
    "audio/adpcm": {
      source: "apache",
      extensions: ["adp"]
    },
    "audio/amr": {
      source: "iana",
      extensions: ["amr"]
    },
    "audio/amr-wb": {
      source: "iana"
    },
    "audio/amr-wb+": {
      source: "iana"
    },
    "audio/aptx": {
      source: "iana"
    },
    "audio/asc": {
      source: "iana"
    },
    "audio/atrac-advanced-lossless": {
      source: "iana"
    },
    "audio/atrac-x": {
      source: "iana"
    },
    "audio/atrac3": {
      source: "iana"
    },
    "audio/basic": {
      source: "iana",
      compressible: false,
      extensions: ["au", "snd"]
    },
    "audio/bv16": {
      source: "iana"
    },
    "audio/bv32": {
      source: "iana"
    },
    "audio/clearmode": {
      source: "iana"
    },
    "audio/cn": {
      source: "iana"
    },
    "audio/dat12": {
      source: "iana"
    },
    "audio/dls": {
      source: "iana"
    },
    "audio/dsr-es201108": {
      source: "iana"
    },
    "audio/dsr-es202050": {
      source: "iana"
    },
    "audio/dsr-es202211": {
      source: "iana"
    },
    "audio/dsr-es202212": {
      source: "iana"
    },
    "audio/dv": {
      source: "iana"
    },
    "audio/dvi4": {
      source: "iana"
    },
    "audio/eac3": {
      source: "iana"
    },
    "audio/encaprtp": {
      source: "iana"
    },
    "audio/evrc": {
      source: "iana"
    },
    "audio/evrc-qcp": {
      source: "iana"
    },
    "audio/evrc0": {
      source: "iana"
    },
    "audio/evrc1": {
      source: "iana"
    },
    "audio/evrcb": {
      source: "iana"
    },
    "audio/evrcb0": {
      source: "iana"
    },
    "audio/evrcb1": {
      source: "iana"
    },
    "audio/evrcnw": {
      source: "iana"
    },
    "audio/evrcnw0": {
      source: "iana"
    },
    "audio/evrcnw1": {
      source: "iana"
    },
    "audio/evrcwb": {
      source: "iana"
    },
    "audio/evrcwb0": {
      source: "iana"
    },
    "audio/evrcwb1": {
      source: "iana"
    },
    "audio/evs": {
      source: "iana"
    },
    "audio/flexfec": {
      source: "iana"
    },
    "audio/fwdred": {
      source: "iana"
    },
    "audio/g711-0": {
      source: "iana"
    },
    "audio/g719": {
      source: "iana"
    },
    "audio/g722": {
      source: "iana"
    },
    "audio/g7221": {
      source: "iana"
    },
    "audio/g723": {
      source: "iana"
    },
    "audio/g726-16": {
      source: "iana"
    },
    "audio/g726-24": {
      source: "iana"
    },
    "audio/g726-32": {
      source: "iana"
    },
    "audio/g726-40": {
      source: "iana"
    },
    "audio/g728": {
      source: "iana"
    },
    "audio/g729": {
      source: "iana"
    },
    "audio/g7291": {
      source: "iana"
    },
    "audio/g729d": {
      source: "iana"
    },
    "audio/g729e": {
      source: "iana"
    },
    "audio/gsm": {
      source: "iana"
    },
    "audio/gsm-efr": {
      source: "iana"
    },
    "audio/gsm-hr-08": {
      source: "iana"
    },
    "audio/ilbc": {
      source: "iana"
    },
    "audio/ip-mr_v2.5": {
      source: "iana"
    },
    "audio/isac": {
      source: "apache"
    },
    "audio/l16": {
      source: "iana"
    },
    "audio/l20": {
      source: "iana"
    },
    "audio/l24": {
      source: "iana",
      compressible: false
    },
    "audio/l8": {
      source: "iana"
    },
    "audio/lpc": {
      source: "iana"
    },
    "audio/melp": {
      source: "iana"
    },
    "audio/melp1200": {
      source: "iana"
    },
    "audio/melp2400": {
      source: "iana"
    },
    "audio/melp600": {
      source: "iana"
    },
    "audio/mhas": {
      source: "iana"
    },
    "audio/midi": {
      source: "apache",
      extensions: ["mid", "midi", "kar", "rmi"]
    },
    "audio/mobile-xmf": {
      source: "iana",
      extensions: ["mxmf"]
    },
    "audio/mp3": {
      compressible: false,
      extensions: ["mp3"]
    },
    "audio/mp4": {
      source: "iana",
      compressible: false,
      extensions: ["m4a", "mp4a"]
    },
    "audio/mp4a-latm": {
      source: "iana"
    },
    "audio/mpa": {
      source: "iana"
    },
    "audio/mpa-robust": {
      source: "iana"
    },
    "audio/mpeg": {
      source: "iana",
      compressible: false,
      extensions: ["mpga", "mp2", "mp2a", "mp3", "m2a", "m3a"]
    },
    "audio/mpeg4-generic": {
      source: "iana"
    },
    "audio/musepack": {
      source: "apache"
    },
    "audio/ogg": {
      source: "iana",
      compressible: false,
      extensions: ["oga", "ogg", "spx", "opus"]
    },
    "audio/opus": {
      source: "iana"
    },
    "audio/parityfec": {
      source: "iana"
    },
    "audio/pcma": {
      source: "iana"
    },
    "audio/pcma-wb": {
      source: "iana"
    },
    "audio/pcmu": {
      source: "iana"
    },
    "audio/pcmu-wb": {
      source: "iana"
    },
    "audio/prs.sid": {
      source: "iana"
    },
    "audio/qcelp": {
      source: "iana"
    },
    "audio/raptorfec": {
      source: "iana"
    },
    "audio/red": {
      source: "iana"
    },
    "audio/rtp-enc-aescm128": {
      source: "iana"
    },
    "audio/rtp-midi": {
      source: "iana"
    },
    "audio/rtploopback": {
      source: "iana"
    },
    "audio/rtx": {
      source: "iana"
    },
    "audio/s3m": {
      source: "apache",
      extensions: ["s3m"]
    },
    "audio/scip": {
      source: "iana"
    },
    "audio/silk": {
      source: "apache",
      extensions: ["sil"]
    },
    "audio/smv": {
      source: "iana"
    },
    "audio/smv-qcp": {
      source: "iana"
    },
    "audio/smv0": {
      source: "iana"
    },
    "audio/sofa": {
      source: "iana"
    },
    "audio/sp-midi": {
      source: "iana"
    },
    "audio/speex": {
      source: "iana"
    },
    "audio/t140c": {
      source: "iana"
    },
    "audio/t38": {
      source: "iana"
    },
    "audio/telephone-event": {
      source: "iana"
    },
    "audio/tetra_acelp": {
      source: "iana"
    },
    "audio/tetra_acelp_bb": {
      source: "iana"
    },
    "audio/tone": {
      source: "iana"
    },
    "audio/tsvcis": {
      source: "iana"
    },
    "audio/uemclip": {
      source: "iana"
    },
    "audio/ulpfec": {
      source: "iana"
    },
    "audio/usac": {
      source: "iana"
    },
    "audio/vdvi": {
      source: "iana"
    },
    "audio/vmr-wb": {
      source: "iana"
    },
    "audio/vnd.3gpp.iufp": {
      source: "iana"
    },
    "audio/vnd.4sb": {
      source: "iana"
    },
    "audio/vnd.audiokoz": {
      source: "iana"
    },
    "audio/vnd.celp": {
      source: "iana"
    },
    "audio/vnd.cisco.nse": {
      source: "iana"
    },
    "audio/vnd.cmles.radio-events": {
      source: "iana"
    },
    "audio/vnd.cns.anp1": {
      source: "iana"
    },
    "audio/vnd.cns.inf1": {
      source: "iana"
    },
    "audio/vnd.dece.audio": {
      source: "iana",
      extensions: ["uva", "uvva"]
    },
    "audio/vnd.digital-winds": {
      source: "iana",
      extensions: ["eol"]
    },
    "audio/vnd.dlna.adts": {
      source: "iana"
    },
    "audio/vnd.dolby.heaac.1": {
      source: "iana"
    },
    "audio/vnd.dolby.heaac.2": {
      source: "iana"
    },
    "audio/vnd.dolby.mlp": {
      source: "iana"
    },
    "audio/vnd.dolby.mps": {
      source: "iana"
    },
    "audio/vnd.dolby.pl2": {
      source: "iana"
    },
    "audio/vnd.dolby.pl2x": {
      source: "iana"
    },
    "audio/vnd.dolby.pl2z": {
      source: "iana"
    },
    "audio/vnd.dolby.pulse.1": {
      source: "iana"
    },
    "audio/vnd.dra": {
      source: "iana",
      extensions: ["dra"]
    },
    "audio/vnd.dts": {
      source: "iana",
      extensions: ["dts"]
    },
    "audio/vnd.dts.hd": {
      source: "iana",
      extensions: ["dtshd"]
    },
    "audio/vnd.dts.uhd": {
      source: "iana"
    },
    "audio/vnd.dvb.file": {
      source: "iana"
    },
    "audio/vnd.everad.plj": {
      source: "iana"
    },
    "audio/vnd.hns.audio": {
      source: "iana"
    },
    "audio/vnd.lucent.voice": {
      source: "iana",
      extensions: ["lvp"]
    },
    "audio/vnd.ms-playready.media.pya": {
      source: "iana",
      extensions: ["pya"]
    },
    "audio/vnd.nokia.mobile-xmf": {
      source: "iana"
    },
    "audio/vnd.nortel.vbk": {
      source: "iana"
    },
    "audio/vnd.nuera.ecelp4800": {
      source: "iana",
      extensions: ["ecelp4800"]
    },
    "audio/vnd.nuera.ecelp7470": {
      source: "iana",
      extensions: ["ecelp7470"]
    },
    "audio/vnd.nuera.ecelp9600": {
      source: "iana",
      extensions: ["ecelp9600"]
    },
    "audio/vnd.octel.sbc": {
      source: "iana"
    },
    "audio/vnd.presonus.multitrack": {
      source: "iana"
    },
    "audio/vnd.qcelp": {
      source: "iana"
    },
    "audio/vnd.rhetorex.32kadpcm": {
      source: "iana"
    },
    "audio/vnd.rip": {
      source: "iana",
      extensions: ["rip"]
    },
    "audio/vnd.rn-realaudio": {
      compressible: false
    },
    "audio/vnd.sealedmedia.softseal.mpeg": {
      source: "iana"
    },
    "audio/vnd.vmx.cvsd": {
      source: "iana"
    },
    "audio/vnd.wave": {
      compressible: false
    },
    "audio/vorbis": {
      source: "iana",
      compressible: false
    },
    "audio/vorbis-config": {
      source: "iana"
    },
    "audio/wav": {
      compressible: false,
      extensions: ["wav"]
    },
    "audio/wave": {
      compressible: false,
      extensions: ["wav"]
    },
    "audio/webm": {
      source: "apache",
      compressible: false,
      extensions: ["weba"]
    },
    "audio/x-aac": {
      source: "apache",
      compressible: false,
      extensions: ["aac"]
    },
    "audio/x-aiff": {
      source: "apache",
      extensions: ["aif", "aiff", "aifc"]
    },
    "audio/x-caf": {
      source: "apache",
      compressible: false,
      extensions: ["caf"]
    },
    "audio/x-flac": {
      source: "apache",
      extensions: ["flac"]
    },
    "audio/x-m4a": {
      source: "nginx",
      extensions: ["m4a"]
    },
    "audio/x-matroska": {
      source: "apache",
      extensions: ["mka"]
    },
    "audio/x-mpegurl": {
      source: "apache",
      extensions: ["m3u"]
    },
    "audio/x-ms-wax": {
      source: "apache",
      extensions: ["wax"]
    },
    "audio/x-ms-wma": {
      source: "apache",
      extensions: ["wma"]
    },
    "audio/x-pn-realaudio": {
      source: "apache",
      extensions: ["ram", "ra"]
    },
    "audio/x-pn-realaudio-plugin": {
      source: "apache",
      extensions: ["rmp"]
    },
    "audio/x-realaudio": {
      source: "nginx",
      extensions: ["ra"]
    },
    "audio/x-tta": {
      source: "apache"
    },
    "audio/x-wav": {
      source: "apache",
      extensions: ["wav"]
    },
    "audio/xm": {
      source: "apache",
      extensions: ["xm"]
    },
    "chemical/x-cdx": {
      source: "apache",
      extensions: ["cdx"]
    },
    "chemical/x-cif": {
      source: "apache",
      extensions: ["cif"]
    },
    "chemical/x-cmdf": {
      source: "apache",
      extensions: ["cmdf"]
    },
    "chemical/x-cml": {
      source: "apache",
      extensions: ["cml"]
    },
    "chemical/x-csml": {
      source: "apache",
      extensions: ["csml"]
    },
    "chemical/x-pdb": {
      source: "apache"
    },
    "chemical/x-xyz": {
      source: "apache",
      extensions: ["xyz"]
    },
    "font/collection": {
      source: "iana",
      extensions: ["ttc"]
    },
    "font/otf": {
      source: "iana",
      compressible: true,
      extensions: ["otf"]
    },
    "font/sfnt": {
      source: "iana"
    },
    "font/ttf": {
      source: "iana",
      compressible: true,
      extensions: ["ttf"]
    },
    "font/woff": {
      source: "iana",
      extensions: ["woff"]
    },
    "font/woff2": {
      source: "iana",
      extensions: ["woff2"]
    },
    "image/aces": {
      source: "iana",
      extensions: ["exr"]
    },
    "image/apng": {
      compressible: false,
      extensions: ["apng"]
    },
    "image/avci": {
      source: "iana",
      extensions: ["avci"]
    },
    "image/avcs": {
      source: "iana",
      extensions: ["avcs"]
    },
    "image/avif": {
      source: "iana",
      compressible: false,
      extensions: ["avif"]
    },
    "image/bmp": {
      source: "iana",
      compressible: true,
      extensions: ["bmp"]
    },
    "image/cgm": {
      source: "iana",
      extensions: ["cgm"]
    },
    "image/dicom-rle": {
      source: "iana",
      extensions: ["drle"]
    },
    "image/emf": {
      source: "iana",
      extensions: ["emf"]
    },
    "image/fits": {
      source: "iana",
      extensions: ["fits"]
    },
    "image/g3fax": {
      source: "iana",
      extensions: ["g3"]
    },
    "image/gif": {
      source: "iana",
      compressible: false,
      extensions: ["gif"]
    },
    "image/heic": {
      source: "iana",
      extensions: ["heic"]
    },
    "image/heic-sequence": {
      source: "iana",
      extensions: ["heics"]
    },
    "image/heif": {
      source: "iana",
      extensions: ["heif"]
    },
    "image/heif-sequence": {
      source: "iana",
      extensions: ["heifs"]
    },
    "image/hej2k": {
      source: "iana",
      extensions: ["hej2"]
    },
    "image/hsj2": {
      source: "iana",
      extensions: ["hsj2"]
    },
    "image/ief": {
      source: "iana",
      extensions: ["ief"]
    },
    "image/jls": {
      source: "iana",
      extensions: ["jls"]
    },
    "image/jp2": {
      source: "iana",
      compressible: false,
      extensions: ["jp2", "jpg2"]
    },
    "image/jpeg": {
      source: "iana",
      compressible: false,
      extensions: ["jpeg", "jpg", "jpe"]
    },
    "image/jph": {
      source: "iana",
      extensions: ["jph"]
    },
    "image/jphc": {
      source: "iana",
      extensions: ["jhc"]
    },
    "image/jpm": {
      source: "iana",
      compressible: false,
      extensions: ["jpm"]
    },
    "image/jpx": {
      source: "iana",
      compressible: false,
      extensions: ["jpx", "jpf"]
    },
    "image/jxr": {
      source: "iana",
      extensions: ["jxr"]
    },
    "image/jxra": {
      source: "iana",
      extensions: ["jxra"]
    },
    "image/jxrs": {
      source: "iana",
      extensions: ["jxrs"]
    },
    "image/jxs": {
      source: "iana",
      extensions: ["jxs"]
    },
    "image/jxsc": {
      source: "iana",
      extensions: ["jxsc"]
    },
    "image/jxsi": {
      source: "iana",
      extensions: ["jxsi"]
    },
    "image/jxss": {
      source: "iana",
      extensions: ["jxss"]
    },
    "image/ktx": {
      source: "iana",
      extensions: ["ktx"]
    },
    "image/ktx2": {
      source: "iana",
      extensions: ["ktx2"]
    },
    "image/naplps": {
      source: "iana"
    },
    "image/pjpeg": {
      compressible: false
    },
    "image/png": {
      source: "iana",
      compressible: false,
      extensions: ["png"]
    },
    "image/prs.btif": {
      source: "iana",
      extensions: ["btif"]
    },
    "image/prs.pti": {
      source: "iana",
      extensions: ["pti"]
    },
    "image/pwg-raster": {
      source: "iana"
    },
    "image/sgi": {
      source: "apache",
      extensions: ["sgi"]
    },
    "image/svg+xml": {
      source: "iana",
      compressible: true,
      extensions: ["svg", "svgz"]
    },
    "image/t38": {
      source: "iana",
      extensions: ["t38"]
    },
    "image/tiff": {
      source: "iana",
      compressible: false,
      extensions: ["tif", "tiff"]
    },
    "image/tiff-fx": {
      source: "iana",
      extensions: ["tfx"]
    },
    "image/vnd.adobe.photoshop": {
      source: "iana",
      compressible: true,
      extensions: ["psd"]
    },
    "image/vnd.airzip.accelerator.azv": {
      source: "iana",
      extensions: ["azv"]
    },
    "image/vnd.cns.inf2": {
      source: "iana"
    },
    "image/vnd.dece.graphic": {
      source: "iana",
      extensions: ["uvi", "uvvi", "uvg", "uvvg"]
    },
    "image/vnd.djvu": {
      source: "iana",
      extensions: ["djvu", "djv"]
    },
    "image/vnd.dvb.subtitle": {
      source: "iana",
      extensions: ["sub"]
    },
    "image/vnd.dwg": {
      source: "iana",
      extensions: ["dwg"]
    },
    "image/vnd.dxf": {
      source: "iana",
      extensions: ["dxf"]
    },
    "image/vnd.fastbidsheet": {
      source: "iana",
      extensions: ["fbs"]
    },
    "image/vnd.fpx": {
      source: "iana",
      extensions: ["fpx"]
    },
    "image/vnd.fst": {
      source: "iana",
      extensions: ["fst"]
    },
    "image/vnd.fujixerox.edmics-mmr": {
      source: "iana",
      extensions: ["mmr"]
    },
    "image/vnd.fujixerox.edmics-rlc": {
      source: "iana",
      extensions: ["rlc"]
    },
    "image/vnd.globalgraphics.pgb": {
      source: "iana"
    },
    "image/vnd.microsoft.icon": {
      source: "iana",
      compressible: true,
      extensions: ["ico"]
    },
    "image/vnd.mix": {
      source: "iana"
    },
    "image/vnd.mozilla.apng": {
      source: "iana"
    },
    "image/vnd.ms-dds": {
      compressible: true,
      extensions: ["dds"]
    },
    "image/vnd.ms-modi": {
      source: "iana",
      extensions: ["mdi"]
    },
    "image/vnd.ms-photo": {
      source: "apache",
      extensions: ["wdp"]
    },
    "image/vnd.net-fpx": {
      source: "iana",
      extensions: ["npx"]
    },
    "image/vnd.pco.b16": {
      source: "iana",
      extensions: ["b16"]
    },
    "image/vnd.radiance": {
      source: "iana"
    },
    "image/vnd.sealed.png": {
      source: "iana"
    },
    "image/vnd.sealedmedia.softseal.gif": {
      source: "iana"
    },
    "image/vnd.sealedmedia.softseal.jpg": {
      source: "iana"
    },
    "image/vnd.svf": {
      source: "iana"
    },
    "image/vnd.tencent.tap": {
      source: "iana",
      extensions: ["tap"]
    },
    "image/vnd.valve.source.texture": {
      source: "iana",
      extensions: ["vtf"]
    },
    "image/vnd.wap.wbmp": {
      source: "iana",
      extensions: ["wbmp"]
    },
    "image/vnd.xiff": {
      source: "iana",
      extensions: ["xif"]
    },
    "image/vnd.zbrush.pcx": {
      source: "iana",
      extensions: ["pcx"]
    },
    "image/webp": {
      source: "apache",
      extensions: ["webp"]
    },
    "image/wmf": {
      source: "iana",
      extensions: ["wmf"]
    },
    "image/x-3ds": {
      source: "apache",
      extensions: ["3ds"]
    },
    "image/x-cmu-raster": {
      source: "apache",
      extensions: ["ras"]
    },
    "image/x-cmx": {
      source: "apache",
      extensions: ["cmx"]
    },
    "image/x-freehand": {
      source: "apache",
      extensions: ["fh", "fhc", "fh4", "fh5", "fh7"]
    },
    "image/x-icon": {
      source: "apache",
      compressible: true,
      extensions: ["ico"]
    },
    "image/x-jng": {
      source: "nginx",
      extensions: ["jng"]
    },
    "image/x-mrsid-image": {
      source: "apache",
      extensions: ["sid"]
    },
    "image/x-ms-bmp": {
      source: "nginx",
      compressible: true,
      extensions: ["bmp"]
    },
    "image/x-pcx": {
      source: "apache",
      extensions: ["pcx"]
    },
    "image/x-pict": {
      source: "apache",
      extensions: ["pic", "pct"]
    },
    "image/x-portable-anymap": {
      source: "apache",
      extensions: ["pnm"]
    },
    "image/x-portable-bitmap": {
      source: "apache",
      extensions: ["pbm"]
    },
    "image/x-portable-graymap": {
      source: "apache",
      extensions: ["pgm"]
    },
    "image/x-portable-pixmap": {
      source: "apache",
      extensions: ["ppm"]
    },
    "image/x-rgb": {
      source: "apache",
      extensions: ["rgb"]
    },
    "image/x-tga": {
      source: "apache",
      extensions: ["tga"]
    },
    "image/x-xbitmap": {
      source: "apache",
      extensions: ["xbm"]
    },
    "image/x-xcf": {
      compressible: false
    },
    "image/x-xpixmap": {
      source: "apache",
      extensions: ["xpm"]
    },
    "image/x-xwindowdump": {
      source: "apache",
      extensions: ["xwd"]
    },
    "message/cpim": {
      source: "iana"
    },
    "message/delivery-status": {
      source: "iana"
    },
    "message/disposition-notification": {
      source: "iana",
      extensions: [
        "disposition-notification"
      ]
    },
    "message/external-body": {
      source: "iana"
    },
    "message/feedback-report": {
      source: "iana"
    },
    "message/global": {
      source: "iana",
      extensions: ["u8msg"]
    },
    "message/global-delivery-status": {
      source: "iana",
      extensions: ["u8dsn"]
    },
    "message/global-disposition-notification": {
      source: "iana",
      extensions: ["u8mdn"]
    },
    "message/global-headers": {
      source: "iana",
      extensions: ["u8hdr"]
    },
    "message/http": {
      source: "iana",
      compressible: false
    },
    "message/imdn+xml": {
      source: "iana",
      compressible: true
    },
    "message/news": {
      source: "iana"
    },
    "message/partial": {
      source: "iana",
      compressible: false
    },
    "message/rfc822": {
      source: "iana",
      compressible: true,
      extensions: ["eml", "mime"]
    },
    "message/s-http": {
      source: "iana"
    },
    "message/sip": {
      source: "iana"
    },
    "message/sipfrag": {
      source: "iana"
    },
    "message/tracking-status": {
      source: "iana"
    },
    "message/vnd.si.simp": {
      source: "iana"
    },
    "message/vnd.wfa.wsc": {
      source: "iana",
      extensions: ["wsc"]
    },
    "model/3mf": {
      source: "iana",
      extensions: ["3mf"]
    },
    "model/e57": {
      source: "iana"
    },
    "model/gltf+json": {
      source: "iana",
      compressible: true,
      extensions: ["gltf"]
    },
    "model/gltf-binary": {
      source: "iana",
      compressible: true,
      extensions: ["glb"]
    },
    "model/iges": {
      source: "iana",
      compressible: false,
      extensions: ["igs", "iges"]
    },
    "model/mesh": {
      source: "iana",
      compressible: false,
      extensions: ["msh", "mesh", "silo"]
    },
    "model/mtl": {
      source: "iana",
      extensions: ["mtl"]
    },
    "model/obj": {
      source: "iana",
      extensions: ["obj"]
    },
    "model/step": {
      source: "iana"
    },
    "model/step+xml": {
      source: "iana",
      compressible: true,
      extensions: ["stpx"]
    },
    "model/step+zip": {
      source: "iana",
      compressible: false,
      extensions: ["stpz"]
    },
    "model/step-xml+zip": {
      source: "iana",
      compressible: false,
      extensions: ["stpxz"]
    },
    "model/stl": {
      source: "iana",
      extensions: ["stl"]
    },
    "model/vnd.collada+xml": {
      source: "iana",
      compressible: true,
      extensions: ["dae"]
    },
    "model/vnd.dwf": {
      source: "iana",
      extensions: ["dwf"]
    },
    "model/vnd.flatland.3dml": {
      source: "iana"
    },
    "model/vnd.gdl": {
      source: "iana",
      extensions: ["gdl"]
    },
    "model/vnd.gs-gdl": {
      source: "apache"
    },
    "model/vnd.gs.gdl": {
      source: "iana"
    },
    "model/vnd.gtw": {
      source: "iana",
      extensions: ["gtw"]
    },
    "model/vnd.moml+xml": {
      source: "iana",
      compressible: true
    },
    "model/vnd.mts": {
      source: "iana",
      extensions: ["mts"]
    },
    "model/vnd.opengex": {
      source: "iana",
      extensions: ["ogex"]
    },
    "model/vnd.parasolid.transmit.binary": {
      source: "iana",
      extensions: ["x_b"]
    },
    "model/vnd.parasolid.transmit.text": {
      source: "iana",
      extensions: ["x_t"]
    },
    "model/vnd.pytha.pyox": {
      source: "iana"
    },
    "model/vnd.rosette.annotated-data-model": {
      source: "iana"
    },
    "model/vnd.sap.vds": {
      source: "iana",
      extensions: ["vds"]
    },
    "model/vnd.usdz+zip": {
      source: "iana",
      compressible: false,
      extensions: ["usdz"]
    },
    "model/vnd.valve.source.compiled-map": {
      source: "iana",
      extensions: ["bsp"]
    },
    "model/vnd.vtu": {
      source: "iana",
      extensions: ["vtu"]
    },
    "model/vrml": {
      source: "iana",
      compressible: false,
      extensions: ["wrl", "vrml"]
    },
    "model/x3d+binary": {
      source: "apache",
      compressible: false,
      extensions: ["x3db", "x3dbz"]
    },
    "model/x3d+fastinfoset": {
      source: "iana",
      extensions: ["x3db"]
    },
    "model/x3d+vrml": {
      source: "apache",
      compressible: false,
      extensions: ["x3dv", "x3dvz"]
    },
    "model/x3d+xml": {
      source: "iana",
      compressible: true,
      extensions: ["x3d", "x3dz"]
    },
    "model/x3d-vrml": {
      source: "iana",
      extensions: ["x3dv"]
    },
    "multipart/alternative": {
      source: "iana",
      compressible: false
    },
    "multipart/appledouble": {
      source: "iana"
    },
    "multipart/byteranges": {
      source: "iana"
    },
    "multipart/digest": {
      source: "iana"
    },
    "multipart/encrypted": {
      source: "iana",
      compressible: false
    },
    "multipart/form-data": {
      source: "iana",
      compressible: false
    },
    "multipart/header-set": {
      source: "iana"
    },
    "multipart/mixed": {
      source: "iana"
    },
    "multipart/multilingual": {
      source: "iana"
    },
    "multipart/parallel": {
      source: "iana"
    },
    "multipart/related": {
      source: "iana",
      compressible: false
    },
    "multipart/report": {
      source: "iana"
    },
    "multipart/signed": {
      source: "iana",
      compressible: false
    },
    "multipart/vnd.bint.med-plus": {
      source: "iana"
    },
    "multipart/voice-message": {
      source: "iana"
    },
    "multipart/x-mixed-replace": {
      source: "iana"
    },
    "text/1d-interleaved-parityfec": {
      source: "iana"
    },
    "text/cache-manifest": {
      source: "iana",
      compressible: true,
      extensions: ["appcache", "manifest"]
    },
    "text/calendar": {
      source: "iana",
      extensions: ["ics", "ifb"]
    },
    "text/calender": {
      compressible: true
    },
    "text/cmd": {
      compressible: true
    },
    "text/coffeescript": {
      extensions: ["coffee", "litcoffee"]
    },
    "text/cql": {
      source: "iana"
    },
    "text/cql-expression": {
      source: "iana"
    },
    "text/cql-identifier": {
      source: "iana"
    },
    "text/css": {
      source: "iana",
      charset: "UTF-8",
      compressible: true,
      extensions: ["css"]
    },
    "text/csv": {
      source: "iana",
      compressible: true,
      extensions: ["csv"]
    },
    "text/csv-schema": {
      source: "iana"
    },
    "text/directory": {
      source: "iana"
    },
    "text/dns": {
      source: "iana"
    },
    "text/ecmascript": {
      source: "iana"
    },
    "text/encaprtp": {
      source: "iana"
    },
    "text/enriched": {
      source: "iana"
    },
    "text/fhirpath": {
      source: "iana"
    },
    "text/flexfec": {
      source: "iana"
    },
    "text/fwdred": {
      source: "iana"
    },
    "text/gff3": {
      source: "iana"
    },
    "text/grammar-ref-list": {
      source: "iana"
    },
    "text/html": {
      source: "iana",
      compressible: true,
      extensions: ["html", "htm", "shtml"]
    },
    "text/jade": {
      extensions: ["jade"]
    },
    "text/javascript": {
      source: "iana",
      compressible: true
    },
    "text/jcr-cnd": {
      source: "iana"
    },
    "text/jsx": {
      compressible: true,
      extensions: ["jsx"]
    },
    "text/less": {
      compressible: true,
      extensions: ["less"]
    },
    "text/markdown": {
      source: "iana",
      compressible: true,
      extensions: ["markdown", "md"]
    },
    "text/mathml": {
      source: "nginx",
      extensions: ["mml"]
    },
    "text/mdx": {
      compressible: true,
      extensions: ["mdx"]
    },
    "text/mizar": {
      source: "iana"
    },
    "text/n3": {
      source: "iana",
      charset: "UTF-8",
      compressible: true,
      extensions: ["n3"]
    },
    "text/parameters": {
      source: "iana",
      charset: "UTF-8"
    },
    "text/parityfec": {
      source: "iana"
    },
    "text/plain": {
      source: "iana",
      compressible: true,
      extensions: ["txt", "text", "conf", "def", "list", "log", "in", "ini"]
    },
    "text/provenance-notation": {
      source: "iana",
      charset: "UTF-8"
    },
    "text/prs.fallenstein.rst": {
      source: "iana"
    },
    "text/prs.lines.tag": {
      source: "iana",
      extensions: ["dsc"]
    },
    "text/prs.prop.logic": {
      source: "iana"
    },
    "text/raptorfec": {
      source: "iana"
    },
    "text/red": {
      source: "iana"
    },
    "text/rfc822-headers": {
      source: "iana"
    },
    "text/richtext": {
      source: "iana",
      compressible: true,
      extensions: ["rtx"]
    },
    "text/rtf": {
      source: "iana",
      compressible: true,
      extensions: ["rtf"]
    },
    "text/rtp-enc-aescm128": {
      source: "iana"
    },
    "text/rtploopback": {
      source: "iana"
    },
    "text/rtx": {
      source: "iana"
    },
    "text/sgml": {
      source: "iana",
      extensions: ["sgml", "sgm"]
    },
    "text/shaclc": {
      source: "iana"
    },
    "text/shex": {
      source: "iana",
      extensions: ["shex"]
    },
    "text/slim": {
      extensions: ["slim", "slm"]
    },
    "text/spdx": {
      source: "iana",
      extensions: ["spdx"]
    },
    "text/strings": {
      source: "iana"
    },
    "text/stylus": {
      extensions: ["stylus", "styl"]
    },
    "text/t140": {
      source: "iana"
    },
    "text/tab-separated-values": {
      source: "iana",
      compressible: true,
      extensions: ["tsv"]
    },
    "text/troff": {
      source: "iana",
      extensions: ["t", "tr", "roff", "man", "me", "ms"]
    },
    "text/turtle": {
      source: "iana",
      charset: "UTF-8",
      extensions: ["ttl"]
    },
    "text/ulpfec": {
      source: "iana"
    },
    "text/uri-list": {
      source: "iana",
      compressible: true,
      extensions: ["uri", "uris", "urls"]
    },
    "text/vcard": {
      source: "iana",
      compressible: true,
      extensions: ["vcard"]
    },
    "text/vnd.a": {
      source: "iana"
    },
    "text/vnd.abc": {
      source: "iana"
    },
    "text/vnd.ascii-art": {
      source: "iana"
    },
    "text/vnd.curl": {
      source: "iana",
      extensions: ["curl"]
    },
    "text/vnd.curl.dcurl": {
      source: "apache",
      extensions: ["dcurl"]
    },
    "text/vnd.curl.mcurl": {
      source: "apache",
      extensions: ["mcurl"]
    },
    "text/vnd.curl.scurl": {
      source: "apache",
      extensions: ["scurl"]
    },
    "text/vnd.debian.copyright": {
      source: "iana",
      charset: "UTF-8"
    },
    "text/vnd.dmclientscript": {
      source: "iana"
    },
    "text/vnd.dvb.subtitle": {
      source: "iana",
      extensions: ["sub"]
    },
    "text/vnd.esmertec.theme-descriptor": {
      source: "iana",
      charset: "UTF-8"
    },
    "text/vnd.familysearch.gedcom": {
      source: "iana",
      extensions: ["ged"]
    },
    "text/vnd.ficlab.flt": {
      source: "iana"
    },
    "text/vnd.fly": {
      source: "iana",
      extensions: ["fly"]
    },
    "text/vnd.fmi.flexstor": {
      source: "iana",
      extensions: ["flx"]
    },
    "text/vnd.gml": {
      source: "iana"
    },
    "text/vnd.graphviz": {
      source: "iana",
      extensions: ["gv"]
    },
    "text/vnd.hans": {
      source: "iana"
    },
    "text/vnd.hgl": {
      source: "iana"
    },
    "text/vnd.in3d.3dml": {
      source: "iana",
      extensions: ["3dml"]
    },
    "text/vnd.in3d.spot": {
      source: "iana",
      extensions: ["spot"]
    },
    "text/vnd.iptc.newsml": {
      source: "iana"
    },
    "text/vnd.iptc.nitf": {
      source: "iana"
    },
    "text/vnd.latex-z": {
      source: "iana"
    },
    "text/vnd.motorola.reflex": {
      source: "iana"
    },
    "text/vnd.ms-mediapackage": {
      source: "iana"
    },
    "text/vnd.net2phone.commcenter.command": {
      source: "iana"
    },
    "text/vnd.radisys.msml-basic-layout": {
      source: "iana"
    },
    "text/vnd.senx.warpscript": {
      source: "iana"
    },
    "text/vnd.si.uricatalogue": {
      source: "iana"
    },
    "text/vnd.sosi": {
      source: "iana"
    },
    "text/vnd.sun.j2me.app-descriptor": {
      source: "iana",
      charset: "UTF-8",
      extensions: ["jad"]
    },
    "text/vnd.trolltech.linguist": {
      source: "iana",
      charset: "UTF-8"
    },
    "text/vnd.wap.si": {
      source: "iana"
    },
    "text/vnd.wap.sl": {
      source: "iana"
    },
    "text/vnd.wap.wml": {
      source: "iana",
      extensions: ["wml"]
    },
    "text/vnd.wap.wmlscript": {
      source: "iana",
      extensions: ["wmls"]
    },
    "text/vtt": {
      source: "iana",
      charset: "UTF-8",
      compressible: true,
      extensions: ["vtt"]
    },
    "text/x-asm": {
      source: "apache",
      extensions: ["s", "asm"]
    },
    "text/x-c": {
      source: "apache",
      extensions: ["c", "cc", "cxx", "cpp", "h", "hh", "dic"]
    },
    "text/x-component": {
      source: "nginx",
      extensions: ["htc"]
    },
    "text/x-fortran": {
      source: "apache",
      extensions: ["f", "for", "f77", "f90"]
    },
    "text/x-gwt-rpc": {
      compressible: true
    },
    "text/x-handlebars-template": {
      extensions: ["hbs"]
    },
    "text/x-java-source": {
      source: "apache",
      extensions: ["java"]
    },
    "text/x-jquery-tmpl": {
      compressible: true
    },
    "text/x-lua": {
      extensions: ["lua"]
    },
    "text/x-markdown": {
      compressible: true,
      extensions: ["mkd"]
    },
    "text/x-nfo": {
      source: "apache",
      extensions: ["nfo"]
    },
    "text/x-opml": {
      source: "apache",
      extensions: ["opml"]
    },
    "text/x-org": {
      compressible: true,
      extensions: ["org"]
    },
    "text/x-pascal": {
      source: "apache",
      extensions: ["p", "pas"]
    },
    "text/x-processing": {
      compressible: true,
      extensions: ["pde"]
    },
    "text/x-sass": {
      extensions: ["sass"]
    },
    "text/x-scss": {
      extensions: ["scss"]
    },
    "text/x-setext": {
      source: "apache",
      extensions: ["etx"]
    },
    "text/x-sfv": {
      source: "apache",
      extensions: ["sfv"]
    },
    "text/x-suse-ymp": {
      compressible: true,
      extensions: ["ymp"]
    },
    "text/x-uuencode": {
      source: "apache",
      extensions: ["uu"]
    },
    "text/x-vcalendar": {
      source: "apache",
      extensions: ["vcs"]
    },
    "text/x-vcard": {
      source: "apache",
      extensions: ["vcf"]
    },
    "text/xml": {
      source: "iana",
      compressible: true,
      extensions: ["xml"]
    },
    "text/xml-external-parsed-entity": {
      source: "iana"
    },
    "text/yaml": {
      compressible: true,
      extensions: ["yaml", "yml"]
    },
    "video/1d-interleaved-parityfec": {
      source: "iana"
    },
    "video/3gpp": {
      source: "iana",
      extensions: ["3gp", "3gpp"]
    },
    "video/3gpp-tt": {
      source: "iana"
    },
    "video/3gpp2": {
      source: "iana",
      extensions: ["3g2"]
    },
    "video/av1": {
      source: "iana"
    },
    "video/bmpeg": {
      source: "iana"
    },
    "video/bt656": {
      source: "iana"
    },
    "video/celb": {
      source: "iana"
    },
    "video/dv": {
      source: "iana"
    },
    "video/encaprtp": {
      source: "iana"
    },
    "video/ffv1": {
      source: "iana"
    },
    "video/flexfec": {
      source: "iana"
    },
    "video/h261": {
      source: "iana",
      extensions: ["h261"]
    },
    "video/h263": {
      source: "iana",
      extensions: ["h263"]
    },
    "video/h263-1998": {
      source: "iana"
    },
    "video/h263-2000": {
      source: "iana"
    },
    "video/h264": {
      source: "iana",
      extensions: ["h264"]
    },
    "video/h264-rcdo": {
      source: "iana"
    },
    "video/h264-svc": {
      source: "iana"
    },
    "video/h265": {
      source: "iana"
    },
    "video/iso.segment": {
      source: "iana",
      extensions: ["m4s"]
    },
    "video/jpeg": {
      source: "iana",
      extensions: ["jpgv"]
    },
    "video/jpeg2000": {
      source: "iana"
    },
    "video/jpm": {
      source: "apache",
      extensions: ["jpm", "jpgm"]
    },
    "video/jxsv": {
      source: "iana"
    },
    "video/mj2": {
      source: "iana",
      extensions: ["mj2", "mjp2"]
    },
    "video/mp1s": {
      source: "iana"
    },
    "video/mp2p": {
      source: "iana"
    },
    "video/mp2t": {
      source: "iana",
      extensions: ["ts"]
    },
    "video/mp4": {
      source: "iana",
      compressible: false,
      extensions: ["mp4", "mp4v", "mpg4"]
    },
    "video/mp4v-es": {
      source: "iana"
    },
    "video/mpeg": {
      source: "iana",
      compressible: false,
      extensions: ["mpeg", "mpg", "mpe", "m1v", "m2v"]
    },
    "video/mpeg4-generic": {
      source: "iana"
    },
    "video/mpv": {
      source: "iana"
    },
    "video/nv": {
      source: "iana"
    },
    "video/ogg": {
      source: "iana",
      compressible: false,
      extensions: ["ogv"]
    },
    "video/parityfec": {
      source: "iana"
    },
    "video/pointer": {
      source: "iana"
    },
    "video/quicktime": {
      source: "iana",
      compressible: false,
      extensions: ["qt", "mov"]
    },
    "video/raptorfec": {
      source: "iana"
    },
    "video/raw": {
      source: "iana"
    },
    "video/rtp-enc-aescm128": {
      source: "iana"
    },
    "video/rtploopback": {
      source: "iana"
    },
    "video/rtx": {
      source: "iana"
    },
    "video/scip": {
      source: "iana"
    },
    "video/smpte291": {
      source: "iana"
    },
    "video/smpte292m": {
      source: "iana"
    },
    "video/ulpfec": {
      source: "iana"
    },
    "video/vc1": {
      source: "iana"
    },
    "video/vc2": {
      source: "iana"
    },
    "video/vnd.cctv": {
      source: "iana"
    },
    "video/vnd.dece.hd": {
      source: "iana",
      extensions: ["uvh", "uvvh"]
    },
    "video/vnd.dece.mobile": {
      source: "iana",
      extensions: ["uvm", "uvvm"]
    },
    "video/vnd.dece.mp4": {
      source: "iana"
    },
    "video/vnd.dece.pd": {
      source: "iana",
      extensions: ["uvp", "uvvp"]
    },
    "video/vnd.dece.sd": {
      source: "iana",
      extensions: ["uvs", "uvvs"]
    },
    "video/vnd.dece.video": {
      source: "iana",
      extensions: ["uvv", "uvvv"]
    },
    "video/vnd.directv.mpeg": {
      source: "iana"
    },
    "video/vnd.directv.mpeg-tts": {
      source: "iana"
    },
    "video/vnd.dlna.mpeg-tts": {
      source: "iana"
    },
    "video/vnd.dvb.file": {
      source: "iana",
      extensions: ["dvb"]
    },
    "video/vnd.fvt": {
      source: "iana",
      extensions: ["fvt"]
    },
    "video/vnd.hns.video": {
      source: "iana"
    },
    "video/vnd.iptvforum.1dparityfec-1010": {
      source: "iana"
    },
    "video/vnd.iptvforum.1dparityfec-2005": {
      source: "iana"
    },
    "video/vnd.iptvforum.2dparityfec-1010": {
      source: "iana"
    },
    "video/vnd.iptvforum.2dparityfec-2005": {
      source: "iana"
    },
    "video/vnd.iptvforum.ttsavc": {
      source: "iana"
    },
    "video/vnd.iptvforum.ttsmpeg2": {
      source: "iana"
    },
    "video/vnd.motorola.video": {
      source: "iana"
    },
    "video/vnd.motorola.videop": {
      source: "iana"
    },
    "video/vnd.mpegurl": {
      source: "iana",
      extensions: ["mxu", "m4u"]
    },
    "video/vnd.ms-playready.media.pyv": {
      source: "iana",
      extensions: ["pyv"]
    },
    "video/vnd.nokia.interleaved-multimedia": {
      source: "iana"
    },
    "video/vnd.nokia.mp4vr": {
      source: "iana"
    },
    "video/vnd.nokia.videovoip": {
      source: "iana"
    },
    "video/vnd.objectvideo": {
      source: "iana"
    },
    "video/vnd.radgamettools.bink": {
      source: "iana"
    },
    "video/vnd.radgamettools.smacker": {
      source: "iana"
    },
    "video/vnd.sealed.mpeg1": {
      source: "iana"
    },
    "video/vnd.sealed.mpeg4": {
      source: "iana"
    },
    "video/vnd.sealed.swf": {
      source: "iana"
    },
    "video/vnd.sealedmedia.softseal.mov": {
      source: "iana"
    },
    "video/vnd.uvvu.mp4": {
      source: "iana",
      extensions: ["uvu", "uvvu"]
    },
    "video/vnd.vivo": {
      source: "iana",
      extensions: ["viv"]
    },
    "video/vnd.youtube.yt": {
      source: "iana"
    },
    "video/vp8": {
      source: "iana"
    },
    "video/vp9": {
      source: "iana"
    },
    "video/webm": {
      source: "apache",
      compressible: false,
      extensions: ["webm"]
    },
    "video/x-f4v": {
      source: "apache",
      extensions: ["f4v"]
    },
    "video/x-fli": {
      source: "apache",
      extensions: ["fli"]
    },
    "video/x-flv": {
      source: "apache",
      compressible: false,
      extensions: ["flv"]
    },
    "video/x-m4v": {
      source: "apache",
      extensions: ["m4v"]
    },
    "video/x-matroska": {
      source: "apache",
      compressible: false,
      extensions: ["mkv", "mk3d", "mks"]
    },
    "video/x-mng": {
      source: "apache",
      extensions: ["mng"]
    },
    "video/x-ms-asf": {
      source: "apache",
      extensions: ["asf", "asx"]
    },
    "video/x-ms-vob": {
      source: "apache",
      extensions: ["vob"]
    },
    "video/x-ms-wm": {
      source: "apache",
      extensions: ["wm"]
    },
    "video/x-ms-wmv": {
      source: "apache",
      compressible: false,
      extensions: ["wmv"]
    },
    "video/x-ms-wmx": {
      source: "apache",
      extensions: ["wmx"]
    },
    "video/x-ms-wvx": {
      source: "apache",
      extensions: ["wvx"]
    },
    "video/x-msvideo": {
      source: "apache",
      extensions: ["avi"]
    },
    "video/x-sgi-movie": {
      source: "apache",
      extensions: ["movie"]
    },
    "video/x-smv": {
      source: "apache",
      extensions: ["smv"]
    },
    "x-conference/x-cooltalk": {
      source: "apache",
      extensions: ["ice"]
    },
    "x-shader/x-fragment": {
      compressible: true
    },
    "x-shader/x-vertex": {
      compressible: true
    }
  };
});

// node_modules/.bun/mime-db@1.52.0/node_modules/mime-db/index.js
var require_mime_db = __commonJS((exports2, module2) => {
  /*!
   * mime-db
   * Copyright(c) 2014 Jonathan Ong
   * Copyright(c) 2015-2022 Douglas Christopher Wilson
   * MIT Licensed
   */
  module2.exports = require_db();
});

// node_modules/.bun/mime-types@2.1.35/node_modules/mime-types/index.js
var require_mime_types = __commonJS((exports2) => {
  /*!
   * mime-types
   * Copyright(c) 2014 Jonathan Ong
   * Copyright(c) 2015 Douglas Christopher Wilson
   * MIT Licensed
   */
  var db = require_mime_db();
  var extname = require("path").extname;
  var EXTRACT_TYPE_REGEXP = /^\s*([^;\s]*)(?:;|\s|$)/;
  var TEXT_TYPE_REGEXP = /^text\//i;
  exports2.charset = charset;
  exports2.charsets = { lookup: charset };
  exports2.contentType = contentType;
  exports2.extension = extension;
  exports2.extensions = Object.create(null);
  exports2.lookup = lookup;
  exports2.types = Object.create(null);
  populateMaps(exports2.extensions, exports2.types);
  function charset(type) {
    if (!type || typeof type !== "string") {
      return false;
    }
    var match = EXTRACT_TYPE_REGEXP.exec(type);
    var mime = match && db[match[1].toLowerCase()];
    if (mime && mime.charset) {
      return mime.charset;
    }
    if (match && TEXT_TYPE_REGEXP.test(match[1])) {
      return "UTF-8";
    }
    return false;
  }
  function contentType(str) {
    if (!str || typeof str !== "string") {
      return false;
    }
    var mime = str.indexOf("/") === -1 ? exports2.lookup(str) : str;
    if (!mime) {
      return false;
    }
    if (mime.indexOf("charset") === -1) {
      var charset2 = exports2.charset(mime);
      if (charset2)
        mime += "; charset=" + charset2.toLowerCase();
    }
    return mime;
  }
  function extension(type) {
    if (!type || typeof type !== "string") {
      return false;
    }
    var match = EXTRACT_TYPE_REGEXP.exec(type);
    var exts = match && exports2.extensions[match[1].toLowerCase()];
    if (!exts || !exts.length) {
      return false;
    }
    return exts[0];
  }
  function lookup(path) {
    if (!path || typeof path !== "string") {
      return false;
    }
    var extension2 = extname("x." + path).toLowerCase().substr(1);
    if (!extension2) {
      return false;
    }
    return exports2.types[extension2] || false;
  }
  function populateMaps(extensions, types) {
    var preference = ["nginx", "apache", undefined, "iana"];
    Object.keys(db).forEach(function forEachMimeType(type) {
      var mime = db[type];
      var exts = mime.extensions;
      if (!exts || !exts.length) {
        return;
      }
      extensions[type] = exts;
      for (var i = 0;i < exts.length; i++) {
        var extension2 = exts[i];
        if (types[extension2]) {
          var from = preference.indexOf(db[types[extension2]].source);
          var to = preference.indexOf(mime.source);
          if (types[extension2] !== "application/octet-stream" && (from > to || from === to && types[extension2].substr(0, 12) === "application/")) {
            continue;
          }
        }
        types[extension2] = type;
      }
    });
  }
});

// node_modules/.bun/ylru@1.4.0/node_modules/ylru/index.js
var require_ylru = __commonJS((exports2, module2) => {
  class LRU {
    constructor(max) {
      this.max = max;
      this.size = 0;
      this.cache = new Map;
      this._cache = new Map;
    }
    get(key, options) {
      let item = this.cache.get(key);
      const maxAge = options && options.maxAge;
      let now;
      function getNow() {
        now = now || Date.now();
        return now;
      }
      if (item) {
        if (item.expired && getNow() > item.expired) {
          item.expired = 0;
          item.value = undefined;
        } else {
          if (maxAge !== undefined) {
            const expired = maxAge ? getNow() + maxAge : 0;
            item.expired = expired;
          }
        }
        return item.value;
      }
      item = this._cache.get(key);
      if (item) {
        if (item.expired && getNow() > item.expired) {
          item.expired = 0;
          item.value = undefined;
        } else {
          this._update(key, item);
          if (maxAge !== undefined) {
            const expired = maxAge ? getNow() + maxAge : 0;
            item.expired = expired;
          }
        }
        return item.value;
      }
    }
    set(key, value, options) {
      const maxAge = options && options.maxAge;
      const expired = maxAge ? Date.now() + maxAge : 0;
      let item = this.cache.get(key);
      if (item) {
        item.expired = expired;
        item.value = value;
      } else {
        item = {
          value,
          expired
        };
        this._update(key, item);
      }
    }
    keys() {
      const cacheKeys = new Set;
      const now = Date.now();
      for (const entry of this.cache.entries()) {
        checkEntry(entry);
      }
      for (const entry of this._cache.entries()) {
        checkEntry(entry);
      }
      function checkEntry(entry) {
        const key = entry[0];
        const item = entry[1];
        if (entry[1].value && !entry[1].expired || item.expired >= now) {
          cacheKeys.add(key);
        }
      }
      return Array.from(cacheKeys.keys());
    }
    reset() {
      this.size = 0;
      this.cache.clear();
      this._cache.clear();
    }
    _update(key, item) {
      this.cache.set(key, item);
      this.size++;
      if (this.size >= this.max) {
        this.size = 0;
        this._cache = this.cache;
        this.cache = new Map;
      }
    }
  }
  module2.exports = LRU;
});

// node_modules/.bun/cache-content-type@1.0.1/node_modules/cache-content-type/index.js
var require_cache_content_type = __commonJS((exports2, module2) => {
  var mimeTypes = require_mime_types();
  var LRU = require_ylru();
  var typeLRUCache = new LRU(100);
  module2.exports = (type) => {
    let mimeType = typeLRUCache.get(type);
    if (!mimeType) {
      mimeType = mimeTypes.contentType(type);
      typeLRUCache.set(type, mimeType);
    }
    return mimeType;
  };
});

// node_modules/.bun/escape-html@1.0.3/node_modules/escape-html/index.js
var require_escape_html = __commonJS((exports2, module2) => {
  /*!
   * escape-html
   * Copyright(c) 2012-2013 TJ Holowaychuk
   * Copyright(c) 2015 Andreas Lubbe
   * Copyright(c) 2015 Tiancheng "Timothy" Gu
   * MIT Licensed
   */
  var matchHtmlRegExp = /["'&<>]/;
  module2.exports = escapeHtml;
  function escapeHtml(string) {
    var str = "" + string;
    var match = matchHtmlRegExp.exec(str);
    if (!match) {
      return str;
    }
    var escape;
    var html = "";
    var index = 0;
    var lastIndex = 0;
    for (index = match.index;index < str.length; index++) {
      switch (str.charCodeAt(index)) {
        case 34:
          escape = "&quot;";
          break;
        case 38:
          escape = "&amp;";
          break;
        case 39:
          escape = "&#39;";
          break;
        case 60:
          escape = "&lt;";
          break;
        case 62:
          escape = "&gt;";
          break;
        default:
          continue;
      }
      if (lastIndex !== index) {
        html += str.substring(lastIndex, index);
      }
      lastIndex = index + 1;
      html += escape;
    }
    return lastIndex !== index ? html + str.substring(lastIndex, index) : html;
  }
});

// node_modules/.bun/media-typer@0.3.0/node_modules/media-typer/index.js
var require_media_typer = __commonJS((exports2) => {
  /*!
   * media-typer
   * Copyright(c) 2014 Douglas Christopher Wilson
   * MIT Licensed
   */
  var paramRegExp = /; *([!#$%&'\*\+\-\.0-9A-Z\^_`a-z\|~]+) *= *("(?:[ !\u0023-\u005b\u005d-\u007e\u0080-\u00ff]|\\[\u0020-\u007e])*"|[!#$%&'\*\+\-\.0-9A-Z\^_`a-z\|~]+) */g;
  var textRegExp = /^[\u0020-\u007e\u0080-\u00ff]+$/;
  var tokenRegExp = /^[!#$%&'\*\+\-\.0-9A-Z\^_`a-z\|~]+$/;
  var qescRegExp = /\\([\u0000-\u007f])/g;
  var quoteRegExp = /([\\"])/g;
  var subtypeNameRegExp = /^[A-Za-z0-9][A-Za-z0-9!#$&^_.-]{0,126}$/;
  var typeNameRegExp = /^[A-Za-z0-9][A-Za-z0-9!#$&^_-]{0,126}$/;
  var typeRegExp = /^ *([A-Za-z0-9][A-Za-z0-9!#$&^_-]{0,126})\/([A-Za-z0-9][A-Za-z0-9!#$&^_.+-]{0,126}) *$/;
  exports2.format = format;
  exports2.parse = parse;
  function format(obj) {
    if (!obj || typeof obj !== "object") {
      throw new TypeError("argument obj is required");
    }
    var parameters = obj.parameters;
    var subtype = obj.subtype;
    var suffix = obj.suffix;
    var type = obj.type;
    if (!type || !typeNameRegExp.test(type)) {
      throw new TypeError("invalid type");
    }
    if (!subtype || !subtypeNameRegExp.test(subtype)) {
      throw new TypeError("invalid subtype");
    }
    var string = type + "/" + subtype;
    if (suffix) {
      if (!typeNameRegExp.test(suffix)) {
        throw new TypeError("invalid suffix");
      }
      string += "+" + suffix;
    }
    if (parameters && typeof parameters === "object") {
      var param;
      var params = Object.keys(parameters).sort();
      for (var i = 0;i < params.length; i++) {
        param = params[i];
        if (!tokenRegExp.test(param)) {
          throw new TypeError("invalid parameter name");
        }
        string += "; " + param + "=" + qstring(parameters[param]);
      }
    }
    return string;
  }
  function parse(string) {
    if (!string) {
      throw new TypeError("argument string is required");
    }
    if (typeof string === "object") {
      string = getcontenttype(string);
    }
    if (typeof string !== "string") {
      throw new TypeError("argument string is required to be a string");
    }
    var index = string.indexOf(";");
    var type = index !== -1 ? string.substr(0, index) : string;
    var key;
    var match;
    var obj = splitType(type);
    var params = {};
    var value;
    paramRegExp.lastIndex = index;
    while (match = paramRegExp.exec(string)) {
      if (match.index !== index) {
        throw new TypeError("invalid parameter format");
      }
      index += match[0].length;
      key = match[1].toLowerCase();
      value = match[2];
      if (value[0] === '"') {
        value = value.substr(1, value.length - 2).replace(qescRegExp, "$1");
      }
      params[key] = value;
    }
    if (index !== -1 && index !== string.length) {
      throw new TypeError("invalid parameter format");
    }
    obj.parameters = params;
    return obj;
  }
  function getcontenttype(obj) {
    if (typeof obj.getHeader === "function") {
      return obj.getHeader("content-type");
    }
    if (typeof obj.headers === "object") {
      return obj.headers && obj.headers["content-type"];
    }
  }
  function qstring(val) {
    var str = String(val);
    if (tokenRegExp.test(str)) {
      return str;
    }
    if (str.length > 0 && !textRegExp.test(str)) {
      throw new TypeError("invalid parameter value");
    }
    return '"' + str.replace(quoteRegExp, "\\$1") + '"';
  }
  function splitType(string) {
    var match = typeRegExp.exec(string.toLowerCase());
    if (!match) {
      throw new TypeError("invalid media type");
    }
    var type = match[1];
    var subtype = match[2];
    var suffix;
    var index = subtype.lastIndexOf("+");
    if (index !== -1) {
      suffix = subtype.substr(index + 1);
      subtype = subtype.substr(0, index);
    }
    var obj = {
      type,
      subtype,
      suffix
    };
    return obj;
  }
});

// node_modules/.bun/type-is@1.6.18/node_modules/type-is/index.js
var require_type_is = __commonJS((exports2, module2) => {
  /*!
   * type-is
   * Copyright(c) 2014 Jonathan Ong
   * Copyright(c) 2014-2015 Douglas Christopher Wilson
   * MIT Licensed
   */
  var typer = require_media_typer();
  var mime = require_mime_types();
  module2.exports = typeofrequest;
  module2.exports.is = typeis;
  module2.exports.hasBody = hasbody;
  module2.exports.normalize = normalize;
  module2.exports.match = mimeMatch;
  function typeis(value, types_) {
    var i;
    var types = types_;
    var val = tryNormalizeType(value);
    if (!val) {
      return false;
    }
    if (types && !Array.isArray(types)) {
      types = new Array(arguments.length - 1);
      for (i = 0;i < types.length; i++) {
        types[i] = arguments[i + 1];
      }
    }
    if (!types || !types.length) {
      return val;
    }
    var type;
    for (i = 0;i < types.length; i++) {
      if (mimeMatch(normalize(type = types[i]), val)) {
        return type[0] === "+" || type.indexOf("*") !== -1 ? val : type;
      }
    }
    return false;
  }
  function hasbody(req) {
    return req.headers["transfer-encoding"] !== undefined || !isNaN(req.headers["content-length"]);
  }
  function typeofrequest(req, types_) {
    var types = types_;
    if (!hasbody(req)) {
      return null;
    }
    if (arguments.length > 2) {
      types = new Array(arguments.length - 1);
      for (var i = 0;i < types.length; i++) {
        types[i] = arguments[i + 1];
      }
    }
    var value = req.headers["content-type"];
    return typeis(value, types);
  }
  function normalize(type) {
    if (typeof type !== "string") {
      return false;
    }
    switch (type) {
      case "urlencoded":
        return "application/x-www-form-urlencoded";
      case "multipart":
        return "multipart/*";
    }
    if (type[0] === "+") {
      return "*/*" + type;
    }
    return type.indexOf("/") === -1 ? mime.lookup(type) : type;
  }
  function mimeMatch(expected, actual) {
    if (expected === false) {
      return false;
    }
    var actualParts = actual.split("/");
    var expectedParts = expected.split("/");
    if (actualParts.length !== 2 || expectedParts.length !== 2) {
      return false;
    }
    if (expectedParts[0] !== "*" && expectedParts[0] !== actualParts[0]) {
      return false;
    }
    if (expectedParts[1].substr(0, 2) === "*+") {
      return expectedParts[1].length <= actualParts[1].length + 1 && expectedParts[1].substr(1) === actualParts[1].substr(1 - expectedParts[1].length);
    }
    if (expectedParts[1] !== "*" && expectedParts[1] !== actualParts[1]) {
      return false;
    }
    return true;
  }
  function normalizeType(value) {
    var type = typer.parse(value);
    type.parameters = undefined;
    return typer.format(type);
  }
  function tryNormalizeType(value) {
    if (!value) {
      return null;
    }
    try {
      return normalizeType(value);
    } catch (err) {
      return null;
    }
  }
});

// node_modules/.bun/statuses@1.5.0/node_modules/statuses/codes.json
var require_codes = __commonJS((exports2, module2) => {
  module2.exports = {
    "100": "Continue",
    "101": "Switching Protocols",
    "102": "Processing",
    "103": "Early Hints",
    "200": "OK",
    "201": "Created",
    "202": "Accepted",
    "203": "Non-Authoritative Information",
    "204": "No Content",
    "205": "Reset Content",
    "206": "Partial Content",
    "207": "Multi-Status",
    "208": "Already Reported",
    "226": "IM Used",
    "300": "Multiple Choices",
    "301": "Moved Permanently",
    "302": "Found",
    "303": "See Other",
    "304": "Not Modified",
    "305": "Use Proxy",
    "306": "(Unused)",
    "307": "Temporary Redirect",
    "308": "Permanent Redirect",
    "400": "Bad Request",
    "401": "Unauthorized",
    "402": "Payment Required",
    "403": "Forbidden",
    "404": "Not Found",
    "405": "Method Not Allowed",
    "406": "Not Acceptable",
    "407": "Proxy Authentication Required",
    "408": "Request Timeout",
    "409": "Conflict",
    "410": "Gone",
    "411": "Length Required",
    "412": "Precondition Failed",
    "413": "Payload Too Large",
    "414": "URI Too Long",
    "415": "Unsupported Media Type",
    "416": "Range Not Satisfiable",
    "417": "Expectation Failed",
    "418": "I'm a teapot",
    "421": "Misdirected Request",
    "422": "Unprocessable Entity",
    "423": "Locked",
    "424": "Failed Dependency",
    "425": "Unordered Collection",
    "426": "Upgrade Required",
    "428": "Precondition Required",
    "429": "Too Many Requests",
    "431": "Request Header Fields Too Large",
    "451": "Unavailable For Legal Reasons",
    "500": "Internal Server Error",
    "501": "Not Implemented",
    "502": "Bad Gateway",
    "503": "Service Unavailable",
    "504": "Gateway Timeout",
    "505": "HTTP Version Not Supported",
    "506": "Variant Also Negotiates",
    "507": "Insufficient Storage",
    "508": "Loop Detected",
    "509": "Bandwidth Limit Exceeded",
    "510": "Not Extended",
    "511": "Network Authentication Required"
  };
});

// node_modules/.bun/statuses@1.5.0/node_modules/statuses/index.js
var require_statuses = __commonJS((exports2, module2) => {
  /*!
   * statuses
   * Copyright(c) 2014 Jonathan Ong
   * Copyright(c) 2016 Douglas Christopher Wilson
   * MIT Licensed
   */
  var codes = require_codes();
  module2.exports = status;
  status.STATUS_CODES = codes;
  status.codes = populateStatusesMap(status, codes);
  status.redirect = {
    300: true,
    301: true,
    302: true,
    303: true,
    305: true,
    307: true,
    308: true
  };
  status.empty = {
    204: true,
    205: true,
    304: true
  };
  status.retry = {
    502: true,
    503: true,
    504: true
  };
  function populateStatusesMap(statuses, codes2) {
    var arr = [];
    Object.keys(codes2).forEach(function forEachCode(code) {
      var message2 = codes2[code];
      var status2 = Number(code);
      statuses[status2] = message2;
      statuses[message2] = status2;
      statuses[message2.toLowerCase()] = status2;
      arr.push(status2);
    });
    return arr;
  }
  function status(code) {
    if (typeof code === "number") {
      if (!status[code])
        throw new Error("invalid status code: " + code);
      return code;
    }
    if (typeof code !== "string") {
      throw new TypeError("code must be a number or string");
    }
    var n = parseInt(code, 10);
    if (!isNaN(n)) {
      if (!status[n])
        throw new Error("invalid status code: " + n);
      return n;
    }
    n = status[code.toLowerCase()];
    if (!n)
      throw new Error('invalid status message: "' + code + '"');
    return n;
  }
});

// node_modules/.bun/destroy@1.2.0/node_modules/destroy/index.js
var require_destroy = __commonJS((exports2, module2) => {
  /*!
   * destroy
   * Copyright(c) 2014 Jonathan Ong
   * Copyright(c) 2015-2022 Douglas Christopher Wilson
   * MIT Licensed
   */
  var EventEmitter = require("events").EventEmitter;
  var ReadStream = require("fs").ReadStream;
  var Stream = require("stream");
  var Zlib = require("zlib");
  module2.exports = destroy;
  function destroy(stream, suppress) {
    if (isFsReadStream(stream)) {
      destroyReadStream(stream);
    } else if (isZlibStream(stream)) {
      destroyZlibStream(stream);
    } else if (hasDestroy(stream)) {
      stream.destroy();
    }
    if (isEventEmitter(stream) && suppress) {
      stream.removeAllListeners("error");
      stream.addListener("error", noop);
    }
    return stream;
  }
  function destroyReadStream(stream) {
    stream.destroy();
    if (typeof stream.close === "function") {
      stream.on("open", onOpenClose);
    }
  }
  function closeZlibStream(stream) {
    if (stream._hadError === true) {
      var prop = stream._binding === null ? "_binding" : "_handle";
      stream[prop] = {
        close: function() {
          this[prop] = null;
        }
      };
    }
    stream.close();
  }
  function destroyZlibStream(stream) {
    if (typeof stream.destroy === "function") {
      if (stream._binding) {
        stream.destroy();
        if (stream._processing) {
          stream._needDrain = true;
          stream.once("drain", onDrainClearBinding);
        } else {
          stream._binding.clear();
        }
      } else if (stream._destroy && stream._destroy !== Stream.Transform.prototype._destroy) {
        stream.destroy();
      } else if (stream._destroy && typeof stream.close === "function") {
        stream.destroyed = true;
        stream.close();
      } else {
        stream.destroy();
      }
    } else if (typeof stream.close === "function") {
      closeZlibStream(stream);
    }
  }
  function hasDestroy(stream) {
    return stream instanceof Stream && typeof stream.destroy === "function";
  }
  function isEventEmitter(val) {
    return val instanceof EventEmitter;
  }
  function isFsReadStream(stream) {
    return stream instanceof ReadStream;
  }
  function isZlibStream(stream) {
    return stream instanceof Zlib.Gzip || stream instanceof Zlib.Gunzip || stream instanceof Zlib.Deflate || stream instanceof Zlib.DeflateRaw || stream instanceof Zlib.Inflate || stream instanceof Zlib.InflateRaw || stream instanceof Zlib.Unzip;
  }
  function noop() {}
  function onDrainClearBinding() {
    this._binding.clear();
  }
  function onOpenClose() {
    if (typeof this.fd === "number") {
      this.close();
    }
  }
});

// node_modules/.bun/vary@1.1.2/node_modules/vary/index.js
var require_vary = __commonJS((exports2, module2) => {
  /*!
   * vary
   * Copyright(c) 2014-2017 Douglas Christopher Wilson
   * MIT Licensed
   */
  module2.exports = vary;
  module2.exports.append = append;
  var FIELD_NAME_REGEXP = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
  function append(header, field) {
    if (typeof header !== "string") {
      throw new TypeError("header argument is required");
    }
    if (!field) {
      throw new TypeError("field argument is required");
    }
    var fields = !Array.isArray(field) ? parse(String(field)) : field;
    for (var j = 0;j < fields.length; j++) {
      if (!FIELD_NAME_REGEXP.test(fields[j])) {
        throw new TypeError("field argument contains an invalid header name");
      }
    }
    if (header === "*") {
      return header;
    }
    var val = header;
    var vals = parse(header.toLowerCase());
    if (fields.indexOf("*") !== -1 || vals.indexOf("*") !== -1) {
      return "*";
    }
    for (var i = 0;i < fields.length; i++) {
      var fld = fields[i].toLowerCase();
      if (vals.indexOf(fld) === -1) {
        vals.push(fld);
        val = val ? val + ", " + fields[i] : fields[i];
      }
    }
    return val;
  }
  function parse(header) {
    var end = 0;
    var list = [];
    var start = 0;
    for (var i = 0, len = header.length;i < len; i++) {
      switch (header.charCodeAt(i)) {
        case 32:
          if (start === end) {
            start = end = i + 1;
          }
          break;
        case 44:
          list.push(header.substring(start, end));
          start = end = i + 1;
          break;
        default:
          end = i + 1;
          break;
      }
    }
    list.push(header.substring(start, end));
    return list;
  }
  function vary(res, field) {
    if (!res || !res.getHeader || !res.setHeader) {
      throw new TypeError("res argument is required");
    }
    var val = res.getHeader("Vary") || "";
    var header = Array.isArray(val) ? val.join(", ") : String(val);
    if (val = append(header, field)) {
      res.setHeader("Vary", val);
    }
  }
});

// node_modules/.bun/only@0.0.2/node_modules/only/index.js
var require_only = __commonJS((exports2, module2) => {
  module2.exports = function(obj, keys) {
    obj = obj || {};
    if (typeof keys == "string")
      keys = keys.split(/ +/);
    return keys.reduce(function(ret, key) {
      if (obj[key] == null)
        return ret;
      ret[key] = obj[key];
      return ret;
    }, {});
  };
});

// node_modules/.bun/encodeurl@1.0.2/node_modules/encodeurl/index.js
var require_encodeurl = __commonJS((exports2, module2) => {
  /*!
   * encodeurl
   * Copyright(c) 2016 Douglas Christopher Wilson
   * MIT Licensed
   */
  module2.exports = encodeUrl;
  var ENCODE_CHARS_REGEXP = /(?:[^\x21\x25\x26-\x3B\x3D\x3F-\x5B\x5D\x5F\x61-\x7A\x7E]|%(?:[^0-9A-Fa-f]|[0-9A-Fa-f][^0-9A-Fa-f]|$))+/g;
  var UNMATCHED_SURROGATE_PAIR_REGEXP = /(^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]|[\uD800-\uDBFF]([^\uDC00-\uDFFF]|$)/g;
  var UNMATCHED_SURROGATE_PAIR_REPLACE = "$1�$2";
  function encodeUrl(url) {
    return String(url).replace(UNMATCHED_SURROGATE_PAIR_REGEXP, UNMATCHED_SURROGATE_PAIR_REPLACE).replace(ENCODE_CHARS_REGEXP, encodeURI);
  }
});

// node_modules/.bun/koa@2.16.4/node_modules/koa/lib/response.js
var require_response = __commonJS((exports2, module2) => {
  var contentDisposition = require_content_disposition();
  var getType = require_cache_content_type();
  var onFinish = require_on_finished();
  var escape = require_escape_html();
  var typeis = require_type_is().is;
  var statuses = require_statuses();
  var destroy = require_destroy();
  var assert = require("assert");
  var extname = require("path").extname;
  var vary = require_vary();
  var only = require_only();
  var util = require("util");
  var encodeUrl = require_encodeurl();
  var Stream = require("stream");
  var URL2 = require("url").URL;
  module2.exports = {
    get socket() {
      return this.res.socket;
    },
    get header() {
      const { res } = this;
      return typeof res.getHeaders === "function" ? res.getHeaders() : res._headers || {};
    },
    get headers() {
      return this.header;
    },
    get status() {
      return this.res.statusCode;
    },
    set status(code) {
      if (this.headerSent)
        return;
      assert(Number.isInteger(code), "status code must be a number");
      assert(code >= 100 && code <= 999, `invalid status code: ${code}`);
      this._explicitStatus = true;
      this.res.statusCode = code;
      if (this.req.httpVersionMajor < 2)
        this.res.statusMessage = statuses[code];
      if (this.body && statuses.empty[code])
        this.body = null;
    },
    get message() {
      return this.res.statusMessage || statuses[this.status];
    },
    set message(msg) {
      this.res.statusMessage = msg;
    },
    get body() {
      return this._body;
    },
    set body(val) {
      const original = this._body;
      this._body = val;
      if (val == null) {
        if (!statuses.empty[this.status])
          this.status = 204;
        if (val === null)
          this._explicitNullBody = true;
        this.remove("Content-Type");
        this.remove("Content-Length");
        this.remove("Transfer-Encoding");
        return;
      }
      if (!this._explicitStatus)
        this.status = 200;
      const setType = !this.has("Content-Type");
      if (typeof val === "string") {
        if (setType)
          this.type = /^\s*</.test(val) ? "html" : "text";
        this.length = Buffer.byteLength(val);
        return;
      }
      if (Buffer.isBuffer(val)) {
        if (setType)
          this.type = "bin";
        this.length = val.length;
        return;
      }
      if (val instanceof Stream) {
        onFinish(this.res, destroy.bind(null, val));
        if (original != val) {
          val.once("error", (err) => this.ctx.onerror(err));
          if (original != null)
            this.remove("Content-Length");
        }
        if (setType)
          this.type = "bin";
        return;
      }
      this.remove("Content-Length");
      this.type = "json";
    },
    set length(n) {
      if (!this.has("Transfer-Encoding")) {
        this.set("Content-Length", n);
      }
    },
    get length() {
      if (this.has("Content-Length")) {
        return parseInt(this.get("Content-Length"), 10) || 0;
      }
      const { body } = this;
      if (!body || body instanceof Stream)
        return;
      if (typeof body === "string")
        return Buffer.byteLength(body);
      if (Buffer.isBuffer(body))
        return body.length;
      return Buffer.byteLength(JSON.stringify(body));
    },
    get headerSent() {
      return this.res.headersSent;
    },
    vary(field) {
      if (this.headerSent)
        return;
      vary(this.res, field);
    },
    _getBackReferrer() {
      const referrer = this.ctx.get("Referrer");
      if (referrer) {
        const url = new URL2(referrer, this.ctx.href);
        if (url.host === this.ctx.host) {
          return referrer;
        }
      }
    },
    redirect(url, alt) {
      if (url === "back") {
        url = this._getBackReferrer() || alt || "/";
      }
      if (/^https?:\/\//i.test(url)) {
        url = new URL2(url).toString();
      }
      this.set("Location", encodeUrl(url));
      if (!statuses.redirect[this.status])
        this.status = 302;
      if (this.ctx.accepts("html")) {
        url = escape(url);
        this.type = "text/html; charset=utf-8";
        this.body = `Redirecting to ${url}.`;
        return;
      }
      this.type = "text/plain; charset=utf-8";
      this.body = `Redirecting to ${url}.`;
    },
    attachment(filename, options) {
      if (filename)
        this.type = extname(filename);
      this.set("Content-Disposition", contentDisposition(filename, options));
    },
    set type(type) {
      type = getType(type);
      if (type) {
        this.set("Content-Type", type);
      } else {
        this.remove("Content-Type");
      }
    },
    set lastModified(val) {
      if (typeof val === "string")
        val = new Date(val);
      this.set("Last-Modified", val.toUTCString());
    },
    get lastModified() {
      const date = this.get("last-modified");
      if (date)
        return new Date(date);
    },
    set etag(val) {
      if (!/^(W\/)?"/.test(val))
        val = `"${val}"`;
      this.set("ETag", val);
    },
    get etag() {
      return this.get("ETag");
    },
    get type() {
      const type = this.get("Content-Type");
      if (!type)
        return "";
      return type.split(";", 1)[0];
    },
    is(type, ...types) {
      return typeis(this.type, type, ...types);
    },
    get(field) {
      return this.header[field.toLowerCase()] || "";
    },
    has(field) {
      return typeof this.res.hasHeader === "function" ? this.res.hasHeader(field) : (field.toLowerCase() in this.headers);
    },
    set(field, val) {
      if (this.headerSent)
        return;
      if (arguments.length === 2) {
        if (Array.isArray(val))
          val = val.map((v) => typeof v === "string" ? v : String(v));
        else if (typeof val !== "string")
          val = String(val);
        this.res.setHeader(field, val);
      } else {
        for (const key in field) {
          this.set(key, field[key]);
        }
      }
    },
    append(field, val) {
      const prev = this.get(field);
      if (prev) {
        val = Array.isArray(prev) ? prev.concat(val) : [prev].concat(val);
      }
      return this.set(field, val);
    },
    remove(field) {
      if (this.headerSent)
        return;
      this.res.removeHeader(field);
    },
    get writable() {
      if (this.res.writableEnded || this.res.finished)
        return false;
      const socket = this.res.socket;
      if (!socket)
        return true;
      return socket.writable;
    },
    inspect() {
      if (!this.res)
        return;
      const o = this.toJSON();
      o.body = this.body;
      return o;
    },
    toJSON() {
      return only(this, [
        "status",
        "message",
        "header"
      ]);
    },
    flushHeaders() {
      this.res.flushHeaders();
    }
  };
  if (util.inspect.custom) {
    module2.exports[util.inspect.custom] = module2.exports.inspect;
  }
});

// node_modules/.bun/koa-compose@4.1.0/node_modules/koa-compose/index.js
var require_koa_compose = __commonJS((exports2, module2) => {
  module2.exports = compose;
  function compose(middleware) {
    if (!Array.isArray(middleware))
      throw new TypeError("Middleware stack must be an array!");
    for (const fn2 of middleware) {
      if (typeof fn2 !== "function")
        throw new TypeError("Middleware must be composed of functions!");
    }
    return function(context, next) {
      let index = -1;
      return dispatch(0);
      function dispatch(i) {
        if (i <= index)
          return Promise.reject(new Error("next() called multiple times"));
        index = i;
        let fn2 = middleware[i];
        if (i === middleware.length)
          fn2 = next;
        if (!fn2)
          return Promise.resolve();
        try {
          return Promise.resolve(fn2(context, dispatch.bind(null, i + 1)));
        } catch (err) {
          return Promise.reject(err);
        }
      }
    };
  }
});

// node_modules/.bun/depd@1.1.2/node_modules/depd/lib/compat/callsite-tostring.js
var require_callsite_tostring = __commonJS((exports2, module2) => {
  /*!
   * depd
   * Copyright(c) 2014 Douglas Christopher Wilson
   * MIT Licensed
   */
  module2.exports = callSiteToString;
  function callSiteFileLocation(callSite) {
    var fileName;
    var fileLocation = "";
    if (callSite.isNative()) {
      fileLocation = "native";
    } else if (callSite.isEval()) {
      fileName = callSite.getScriptNameOrSourceURL();
      if (!fileName) {
        fileLocation = callSite.getEvalOrigin();
      }
    } else {
      fileName = callSite.getFileName();
    }
    if (fileName) {
      fileLocation += fileName;
      var lineNumber = callSite.getLineNumber();
      if (lineNumber != null) {
        fileLocation += ":" + lineNumber;
        var columnNumber = callSite.getColumnNumber();
        if (columnNumber) {
          fileLocation += ":" + columnNumber;
        }
      }
    }
    return fileLocation || "unknown source";
  }
  function callSiteToString(callSite) {
    var addSuffix = true;
    var fileLocation = callSiteFileLocation(callSite);
    var functionName = callSite.getFunctionName();
    var isConstructor = callSite.isConstructor();
    var isMethodCall = !(callSite.isToplevel() || isConstructor);
    var line = "";
    if (isMethodCall) {
      var methodName = callSite.getMethodName();
      var typeName = getConstructorName(callSite);
      if (functionName) {
        if (typeName && functionName.indexOf(typeName) !== 0) {
          line += typeName + ".";
        }
        line += functionName;
        if (methodName && functionName.lastIndexOf("." + methodName) !== functionName.length - methodName.length - 1) {
          line += " [as " + methodName + "]";
        }
      } else {
        line += typeName + "." + (methodName || "<anonymous>");
      }
    } else if (isConstructor) {
      line += "new " + (functionName || "<anonymous>");
    } else if (functionName) {
      line += functionName;
    } else {
      addSuffix = false;
      line += fileLocation;
    }
    if (addSuffix) {
      line += " (" + fileLocation + ")";
    }
    return line;
  }
  function getConstructorName(obj) {
    var receiver = obj.receiver;
    return receiver.constructor && receiver.constructor.name || null;
  }
});

// node_modules/.bun/depd@1.1.2/node_modules/depd/lib/compat/event-listener-count.js
var require_event_listener_count = __commonJS((exports2, module2) => {
  /*!
   * depd
   * Copyright(c) 2015 Douglas Christopher Wilson
   * MIT Licensed
   */
  module2.exports = eventListenerCount;
  function eventListenerCount(emitter, type) {
    return emitter.listeners(type).length;
  }
});

// node_modules/.bun/depd@1.1.2/node_modules/depd/lib/compat/index.js
var require_compat = __commonJS((exports2, module2) => {
  /*!
   * depd
   * Copyright(c) 2014-2015 Douglas Christopher Wilson
   * MIT Licensed
   */
  var EventEmitter = require("events").EventEmitter;
  lazyProperty(module2.exports, "callSiteToString", function callSiteToString() {
    var limit = Error.stackTraceLimit;
    var obj = {};
    var prep = Error.prepareStackTrace;
    function prepareObjectStackTrace(obj2, stack3) {
      return stack3;
    }
    Error.prepareStackTrace = prepareObjectStackTrace;
    Error.stackTraceLimit = 2;
    Error.captureStackTrace(obj);
    var stack2 = obj.stack.slice();
    Error.prepareStackTrace = prep;
    Error.stackTraceLimit = limit;
    return stack2[0].toString ? toString : require_callsite_tostring();
  });
  lazyProperty(module2.exports, "eventListenerCount", function eventListenerCount() {
    return EventEmitter.listenerCount || require_event_listener_count();
  });
  function lazyProperty(obj, prop, getter) {
    function get() {
      var val = getter();
      Object.defineProperty(obj, prop, {
        configurable: true,
        enumerable: true,
        value: val
      });
      return val;
    }
    Object.defineProperty(obj, prop, {
      configurable: true,
      enumerable: true,
      get
    });
  }
  function toString(obj) {
    return obj.toString();
  }
});

// node_modules/.bun/depd@1.1.2/node_modules/depd/index.js
var require_depd = __commonJS((exports2, module2) => {
  /*!
   * depd
   * Copyright(c) 2014-2017 Douglas Christopher Wilson
   * MIT Licensed
   */
  var callSiteToString = require_compat().callSiteToString;
  var eventListenerCount = require_compat().eventListenerCount;
  var relative = require("path").relative;
  module2.exports = depd;
  var basePath = process.cwd();
  function containsNamespace(str, namespace) {
    var vals = str.split(/[ ,]+/);
    var ns = String(namespace).toLowerCase();
    for (var i = 0;i < vals.length; i++) {
      var val = vals[i];
      if (val && (val === "*" || val.toLowerCase() === ns)) {
        return true;
      }
    }
    return false;
  }
  function convertDataDescriptorToAccessor(obj, prop, message2) {
    var descriptor = Object.getOwnPropertyDescriptor(obj, prop);
    var value = descriptor.value;
    descriptor.get = function getter() {
      return value;
    };
    if (descriptor.writable) {
      descriptor.set = function setter(val) {
        return value = val;
      };
    }
    delete descriptor.value;
    delete descriptor.writable;
    Object.defineProperty(obj, prop, descriptor);
    return descriptor;
  }
  function createArgumentsString(arity) {
    var str = "";
    for (var i = 0;i < arity; i++) {
      str += ", arg" + i;
    }
    return str.substr(2);
  }
  function createStackString(stack2) {
    var str = this.name + ": " + this.namespace;
    if (this.message) {
      str += " deprecated " + this.message;
    }
    for (var i = 0;i < stack2.length; i++) {
      str += `
    at ` + callSiteToString(stack2[i]);
    }
    return str;
  }
  function depd(namespace) {
    if (!namespace) {
      throw new TypeError("argument namespace is required");
    }
    var stack2 = getStack();
    var site2 = callSiteLocation(stack2[1]);
    var file = site2[0];
    function deprecate2(message2) {
      log.call(deprecate2, message2);
    }
    deprecate2._file = file;
    deprecate2._ignored = isignored(namespace);
    deprecate2._namespace = namespace;
    deprecate2._traced = istraced(namespace);
    deprecate2._warned = Object.create(null);
    deprecate2.function = wrapfunction;
    deprecate2.property = wrapproperty;
    return deprecate2;
  }
  function isignored(namespace) {
    if (process.noDeprecation) {
      return true;
    }
    var str = process.env.NO_DEPRECATION || "";
    return containsNamespace(str, namespace);
  }
  function istraced(namespace) {
    if (process.traceDeprecation) {
      return true;
    }
    var str = process.env.TRACE_DEPRECATION || "";
    return containsNamespace(str, namespace);
  }
  function log(message2, site2) {
    var haslisteners = eventListenerCount(process, "deprecation") !== 0;
    if (!haslisteners && this._ignored) {
      return;
    }
    var caller;
    var callFile;
    var callSite;
    var depSite;
    var i = 0;
    var seen = false;
    var stack2 = getStack();
    var file = this._file;
    if (site2) {
      depSite = site2;
      callSite = callSiteLocation(stack2[1]);
      callSite.name = depSite.name;
      file = callSite[0];
    } else {
      i = 2;
      depSite = callSiteLocation(stack2[i]);
      callSite = depSite;
    }
    for (;i < stack2.length; i++) {
      caller = callSiteLocation(stack2[i]);
      callFile = caller[0];
      if (callFile === file) {
        seen = true;
      } else if (callFile === this._file) {
        file = this._file;
      } else if (seen) {
        break;
      }
    }
    var key = caller ? depSite.join(":") + "__" + caller.join(":") : undefined;
    if (key !== undefined && key in this._warned) {
      return;
    }
    this._warned[key] = true;
    var msg = message2;
    if (!msg) {
      msg = callSite === depSite || !callSite.name ? defaultMessage(depSite) : defaultMessage(callSite);
    }
    if (haslisteners) {
      var err = DeprecationError(this._namespace, msg, stack2.slice(i));
      process.emit("deprecation", err);
      return;
    }
    var format = process.stderr.isTTY ? formatColor : formatPlain;
    var output = format.call(this, msg, caller, stack2.slice(i));
    process.stderr.write(output + `
`, "utf8");
  }
  function callSiteLocation(callSite) {
    var file = callSite.getFileName() || "<anonymous>";
    var line = callSite.getLineNumber();
    var colm = callSite.getColumnNumber();
    if (callSite.isEval()) {
      file = callSite.getEvalOrigin() + ", " + file;
    }
    var site2 = [file, line, colm];
    site2.callSite = callSite;
    site2.name = callSite.getFunctionName();
    return site2;
  }
  function defaultMessage(site2) {
    var callSite = site2.callSite;
    var funcName = site2.name;
    if (!funcName) {
      funcName = "<anonymous@" + formatLocation(site2) + ">";
    }
    var context = callSite.getThis();
    var typeName = context && callSite.getTypeName();
    if (typeName === "Object") {
      typeName = undefined;
    }
    if (typeName === "Function") {
      typeName = context.name || typeName;
    }
    return typeName && callSite.getMethodName() ? typeName + "." + funcName : funcName;
  }
  function formatPlain(msg, caller, stack2) {
    var timestamp = new Date().toUTCString();
    var formatted = timestamp + " " + this._namespace + " deprecated " + msg;
    if (this._traced) {
      for (var i = 0;i < stack2.length; i++) {
        formatted += `
    at ` + callSiteToString(stack2[i]);
      }
      return formatted;
    }
    if (caller) {
      formatted += " at " + formatLocation(caller);
    }
    return formatted;
  }
  function formatColor(msg, caller, stack2) {
    var formatted = "\x1B[36;1m" + this._namespace + "\x1B[22;39m" + " \x1B[33;1mdeprecated\x1B[22;39m" + " \x1B[0m" + msg + "\x1B[39m";
    if (this._traced) {
      for (var i = 0;i < stack2.length; i++) {
        formatted += `
    \x1B[36mat ` + callSiteToString(stack2[i]) + "\x1B[39m";
      }
      return formatted;
    }
    if (caller) {
      formatted += " \x1B[36m" + formatLocation(caller) + "\x1B[39m";
    }
    return formatted;
  }
  function formatLocation(callSite) {
    return relative(basePath, callSite[0]) + ":" + callSite[1] + ":" + callSite[2];
  }
  function getStack() {
    var limit = Error.stackTraceLimit;
    var obj = {};
    var prep = Error.prepareStackTrace;
    Error.prepareStackTrace = prepareObjectStackTrace;
    Error.stackTraceLimit = Math.max(10, limit);
    Error.captureStackTrace(obj);
    var stack2 = obj.stack.slice(1);
    Error.prepareStackTrace = prep;
    Error.stackTraceLimit = limit;
    return stack2;
  }
  function prepareObjectStackTrace(obj, stack2) {
    return stack2;
  }
  function wrapfunction(fn, message) {
    if (typeof fn !== "function") {
      throw new TypeError("argument fn must be a function");
    }
    var args = createArgumentsString(fn.length);
    var deprecate = this;
    var stack = getStack();
    var site = callSiteLocation(stack[1]);
    site.name = fn.name;
    var deprecatedfn = eval("(function (" + args + `) {
` + `"use strict"
` + `log.call(deprecate, message, site)
` + `return fn.apply(this, arguments)
` + "})");
    return deprecatedfn;
  }
  function wrapproperty(obj, prop, message2) {
    if (!obj || typeof obj !== "object" && typeof obj !== "function") {
      throw new TypeError("argument obj must be object");
    }
    var descriptor = Object.getOwnPropertyDescriptor(obj, prop);
    if (!descriptor) {
      throw new TypeError("must call property on owner object");
    }
    if (!descriptor.configurable) {
      throw new TypeError("property must be configurable");
    }
    var deprecate2 = this;
    var stack2 = getStack();
    var site2 = callSiteLocation(stack2[1]);
    site2.name = prop;
    if ("value" in descriptor) {
      descriptor = convertDataDescriptorToAccessor(obj, prop, message2);
    }
    var get = descriptor.get;
    var set = descriptor.set;
    if (typeof get === "function") {
      descriptor.get = function getter() {
        log.call(deprecate2, message2, site2);
        return get.apply(this, arguments);
      };
    }
    if (typeof set === "function") {
      descriptor.set = function setter() {
        log.call(deprecate2, message2, site2);
        return set.apply(this, arguments);
      };
    }
    Object.defineProperty(obj, prop, descriptor);
  }
  function DeprecationError(namespace, message2, stack2) {
    var error = new Error;
    var stackString;
    Object.defineProperty(error, "constructor", {
      value: DeprecationError
    });
    Object.defineProperty(error, "message", {
      configurable: true,
      enumerable: false,
      value: message2,
      writable: true
    });
    Object.defineProperty(error, "name", {
      enumerable: false,
      configurable: true,
      value: "DeprecationError",
      writable: true
    });
    Object.defineProperty(error, "namespace", {
      configurable: true,
      enumerable: false,
      value: namespace,
      writable: true
    });
    Object.defineProperty(error, "stack", {
      configurable: true,
      enumerable: false,
      get: function() {
        if (stackString !== undefined) {
          return stackString;
        }
        return stackString = createStackString.call(this, stack2);
      },
      set: function setter(val) {
        stackString = val;
      }
    });
    return error;
  }
});

// node_modules/.bun/setprototypeof@1.2.0/node_modules/setprototypeof/index.js
var require_setprototypeof = __commonJS((exports2, module2) => {
  module2.exports = Object.setPrototypeOf || ({ __proto__: [] } instanceof Array ? setProtoOf : mixinProperties);
  function setProtoOf(obj, proto) {
    obj.__proto__ = proto;
    return obj;
  }
  function mixinProperties(obj, proto) {
    for (var prop in proto) {
      if (!Object.prototype.hasOwnProperty.call(obj, prop)) {
        obj[prop] = proto[prop];
      }
    }
    return obj;
  }
});

// node_modules/.bun/inherits@2.0.4/node_modules/inherits/inherits_browser.js
var require_inherits_browser = __commonJS((exports2, module2) => {
  if (typeof Object.create === "function") {
    module2.exports = function inherits(ctor, superCtor) {
      if (superCtor) {
        ctor.super_ = superCtor;
        ctor.prototype = Object.create(superCtor.prototype, {
          constructor: {
            value: ctor,
            enumerable: false,
            writable: true,
            configurable: true
          }
        });
      }
    };
  } else {
    module2.exports = function inherits(ctor, superCtor) {
      if (superCtor) {
        ctor.super_ = superCtor;
        var TempCtor = function() {};
        TempCtor.prototype = superCtor.prototype;
        ctor.prototype = new TempCtor;
        ctor.prototype.constructor = ctor;
      }
    };
  }
});

// node_modules/.bun/inherits@2.0.4/node_modules/inherits/inherits.js
var require_inherits = __commonJS((exports2, module2) => {
  try {
    util = require("util");
    if (typeof util.inherits !== "function")
      throw "";
    module2.exports = util.inherits;
  } catch (e) {
    module2.exports = require_inherits_browser();
  }
  var util;
});

// node_modules/.bun/toidentifier@1.0.1/node_modules/toidentifier/index.js
var require_toidentifier = __commonJS((exports2, module2) => {
  /*!
   * toidentifier
   * Copyright(c) 2016 Douglas Christopher Wilson
   * MIT Licensed
   */
  module2.exports = toIdentifier;
  function toIdentifier(str) {
    return str.split(" ").map(function(token) {
      return token.slice(0, 1).toUpperCase() + token.slice(1);
    }).join("").replace(/[^ _0-9a-z]/gi, "");
  }
});

// node_modules/.bun/http-errors@1.8.1/node_modules/http-errors/index.js
var require_http_errors = __commonJS((exports2, module2) => {
  /*!
   * http-errors
   * Copyright(c) 2014 Jonathan Ong
   * Copyright(c) 2016 Douglas Christopher Wilson
   * MIT Licensed
   */
  var deprecate2 = require_depd()("http-errors");
  var setPrototypeOf = require_setprototypeof();
  var statuses = require_statuses();
  var inherits = require_inherits();
  var toIdentifier = require_toidentifier();
  module2.exports = createError;
  module2.exports.HttpError = createHttpErrorConstructor();
  module2.exports.isHttpError = createIsHttpErrorFunction(module2.exports.HttpError);
  populateConstructorExports(module2.exports, statuses.codes, module2.exports.HttpError);
  function codeClass(status) {
    return Number(String(status).charAt(0) + "00");
  }
  function createError() {
    var err;
    var msg;
    var status = 500;
    var props = {};
    for (var i = 0;i < arguments.length; i++) {
      var arg = arguments[i];
      if (arg instanceof Error) {
        err = arg;
        status = err.status || err.statusCode || status;
        continue;
      }
      switch (typeof arg) {
        case "string":
          msg = arg;
          break;
        case "number":
          status = arg;
          if (i !== 0) {
            deprecate2("non-first-argument status code; replace with createError(" + arg + ", ...)");
          }
          break;
        case "object":
          props = arg;
          break;
      }
    }
    if (typeof status === "number" && (status < 400 || status >= 600)) {
      deprecate2("non-error status code; use only 4xx or 5xx status codes");
    }
    if (typeof status !== "number" || !statuses[status] && (status < 400 || status >= 600)) {
      status = 500;
    }
    var HttpError = createError[status] || createError[codeClass(status)];
    if (!err) {
      err = HttpError ? new HttpError(msg) : new Error(msg || statuses[status]);
      Error.captureStackTrace(err, createError);
    }
    if (!HttpError || !(err instanceof HttpError) || err.status !== status) {
      err.expose = status < 500;
      err.status = err.statusCode = status;
    }
    for (var key in props) {
      if (key !== "status" && key !== "statusCode") {
        err[key] = props[key];
      }
    }
    return err;
  }
  function createHttpErrorConstructor() {
    function HttpError() {
      throw new TypeError("cannot construct abstract class");
    }
    inherits(HttpError, Error);
    return HttpError;
  }
  function createClientErrorConstructor(HttpError, name, code) {
    var className = toClassName(name);
    function ClientError(message2) {
      var msg = message2 != null ? message2 : statuses[code];
      var err = new Error(msg);
      Error.captureStackTrace(err, ClientError);
      setPrototypeOf(err, ClientError.prototype);
      Object.defineProperty(err, "message", {
        enumerable: true,
        configurable: true,
        value: msg,
        writable: true
      });
      Object.defineProperty(err, "name", {
        enumerable: false,
        configurable: true,
        value: className,
        writable: true
      });
      return err;
    }
    inherits(ClientError, HttpError);
    nameFunc(ClientError, className);
    ClientError.prototype.status = code;
    ClientError.prototype.statusCode = code;
    ClientError.prototype.expose = true;
    return ClientError;
  }
  function createIsHttpErrorFunction(HttpError) {
    return function isHttpError(val) {
      if (!val || typeof val !== "object") {
        return false;
      }
      if (val instanceof HttpError) {
        return true;
      }
      return val instanceof Error && typeof val.expose === "boolean" && typeof val.statusCode === "number" && val.status === val.statusCode;
    };
  }
  function createServerErrorConstructor(HttpError, name, code) {
    var className = toClassName(name);
    function ServerError(message2) {
      var msg = message2 != null ? message2 : statuses[code];
      var err = new Error(msg);
      Error.captureStackTrace(err, ServerError);
      setPrototypeOf(err, ServerError.prototype);
      Object.defineProperty(err, "message", {
        enumerable: true,
        configurable: true,
        value: msg,
        writable: true
      });
      Object.defineProperty(err, "name", {
        enumerable: false,
        configurable: true,
        value: className,
        writable: true
      });
      return err;
    }
    inherits(ServerError, HttpError);
    nameFunc(ServerError, className);
    ServerError.prototype.status = code;
    ServerError.prototype.statusCode = code;
    ServerError.prototype.expose = false;
    return ServerError;
  }
  function nameFunc(func, name) {
    var desc = Object.getOwnPropertyDescriptor(func, "name");
    if (desc && desc.configurable) {
      desc.value = name;
      Object.defineProperty(func, "name", desc);
    }
  }
  function populateConstructorExports(exports3, codes, HttpError) {
    codes.forEach(function forEachCode(code) {
      var CodeError;
      var name = toIdentifier(statuses[code]);
      switch (codeClass(code)) {
        case 400:
          CodeError = createClientErrorConstructor(HttpError, name, code);
          break;
        case 500:
          CodeError = createServerErrorConstructor(HttpError, name, code);
          break;
      }
      if (CodeError) {
        exports3[code] = CodeError;
        exports3[name] = CodeError;
      }
    });
    exports3["I'mateapot"] = deprecate2.function(exports3.ImATeapot, `"I'mateapot"; use "ImATeapot" instead`);
  }
  function toClassName(name) {
    return name.substr(-5) !== "Error" ? name + "Error" : name;
  }
});

// node_modules/.bun/deep-equal@1.0.1/node_modules/deep-equal/lib/keys.js
var require_keys = __commonJS((exports2, module2) => {
  exports2 = module2.exports = typeof Object.keys === "function" ? Object.keys : shim;
  exports2.shim = shim;
  function shim(obj) {
    var keys = [];
    for (var key in obj)
      keys.push(key);
    return keys;
  }
});

// node_modules/.bun/deep-equal@1.0.1/node_modules/deep-equal/lib/is_arguments.js
var require_is_arguments = __commonJS((exports2, module2) => {
  var supportsArgumentsClass = function() {
    return Object.prototype.toString.call(arguments);
  }() == "[object Arguments]";
  exports2 = module2.exports = supportsArgumentsClass ? supported : unsupported;
  exports2.supported = supported;
  function supported(object) {
    return Object.prototype.toString.call(object) == "[object Arguments]";
  }
  exports2.unsupported = unsupported;
  function unsupported(object) {
    return object && typeof object == "object" && typeof object.length == "number" && Object.prototype.hasOwnProperty.call(object, "callee") && !Object.prototype.propertyIsEnumerable.call(object, "callee") || false;
  }
});

// node_modules/.bun/deep-equal@1.0.1/node_modules/deep-equal/index.js
var require_deep_equal = __commonJS((exports2, module2) => {
  var pSlice = Array.prototype.slice;
  var objectKeys = require_keys();
  var isArguments = require_is_arguments();
  var deepEqual = module2.exports = function(actual, expected, opts) {
    if (!opts)
      opts = {};
    if (actual === expected) {
      return true;
    } else if (actual instanceof Date && expected instanceof Date) {
      return actual.getTime() === expected.getTime();
    } else if (!actual || !expected || typeof actual != "object" && typeof expected != "object") {
      return opts.strict ? actual === expected : actual == expected;
    } else {
      return objEquiv(actual, expected, opts);
    }
  };
  function isUndefinedOrNull(value) {
    return value === null || value === undefined;
  }
  function isBuffer(x) {
    if (!x || typeof x !== "object" || typeof x.length !== "number")
      return false;
    if (typeof x.copy !== "function" || typeof x.slice !== "function") {
      return false;
    }
    if (x.length > 0 && typeof x[0] !== "number")
      return false;
    return true;
  }
  function objEquiv(a, b, opts) {
    var i, key;
    if (isUndefinedOrNull(a) || isUndefinedOrNull(b))
      return false;
    if (a.prototype !== b.prototype)
      return false;
    if (isArguments(a)) {
      if (!isArguments(b)) {
        return false;
      }
      a = pSlice.call(a);
      b = pSlice.call(b);
      return deepEqual(a, b, opts);
    }
    if (isBuffer(a)) {
      if (!isBuffer(b)) {
        return false;
      }
      if (a.length !== b.length)
        return false;
      for (i = 0;i < a.length; i++) {
        if (a[i] !== b[i])
          return false;
      }
      return true;
    }
    try {
      var ka = objectKeys(a), kb = objectKeys(b);
    } catch (e) {
      return false;
    }
    if (ka.length != kb.length)
      return false;
    ka.sort();
    kb.sort();
    for (i = ka.length - 1;i >= 0; i--) {
      if (ka[i] != kb[i])
        return false;
    }
    for (i = ka.length - 1;i >= 0; i--) {
      key = ka[i];
      if (!deepEqual(a[key], b[key], opts))
        return false;
    }
    return typeof a === typeof b;
  }
});

// node_modules/.bun/http-assert@1.5.0/node_modules/http-assert/index.js
var require_http_assert = __commonJS((exports2, module2) => {
  var createError = require_http_errors();
  var eql = require_deep_equal();
  module2.exports = assert;
  function assert(value, status, msg, opts) {
    if (value)
      return;
    throw createError(status, msg, opts);
  }
  assert.fail = function(status, msg, opts) {
    assert(false, status, msg, opts);
  };
  assert.equal = function(a, b, status, msg, opts) {
    assert(a == b, status, msg, opts);
  };
  assert.notEqual = function(a, b, status, msg, opts) {
    assert(a != b, status, msg, opts);
  };
  assert.ok = function(value, status, msg, opts) {
    assert(value, status, msg, opts);
  };
  assert.strictEqual = function(a, b, status, msg, opts) {
    assert(a === b, status, msg, opts);
  };
  assert.notStrictEqual = function(a, b, status, msg, opts) {
    assert(a !== b, status, msg, opts);
  };
  assert.deepEqual = function(a, b, status, msg, opts) {
    assert(eql(a, b), status, msg, opts);
  };
  assert.notDeepEqual = function(a, b, status, msg, opts) {
    assert(!eql(a, b), status, msg, opts);
  };
});

// node_modules/.bun/delegates@1.0.0/node_modules/delegates/index.js
var require_delegates = __commonJS((exports2, module2) => {
  module2.exports = Delegator;
  function Delegator(proto, target) {
    if (!(this instanceof Delegator))
      return new Delegator(proto, target);
    this.proto = proto;
    this.target = target;
    this.methods = [];
    this.getters = [];
    this.setters = [];
    this.fluents = [];
  }
  Delegator.prototype.method = function(name) {
    var proto = this.proto;
    var target = this.target;
    this.methods.push(name);
    proto[name] = function() {
      return this[target][name].apply(this[target], arguments);
    };
    return this;
  };
  Delegator.prototype.access = function(name) {
    return this.getter(name).setter(name);
  };
  Delegator.prototype.getter = function(name) {
    var proto = this.proto;
    var target = this.target;
    this.getters.push(name);
    proto.__defineGetter__(name, function() {
      return this[target][name];
    });
    return this;
  };
  Delegator.prototype.setter = function(name) {
    var proto = this.proto;
    var target = this.target;
    this.setters.push(name);
    proto.__defineSetter__(name, function(val) {
      return this[target][name] = val;
    });
    return this;
  };
  Delegator.prototype.fluent = function(name) {
    var proto = this.proto;
    var target = this.target;
    this.fluents.push(name);
    proto[name] = function(val) {
      if (typeof val != "undefined") {
        this[target][name] = val;
        return this;
      } else {
        return this[target][name];
      }
    };
    return this;
  };
});

// node_modules/.bun/depd@2.0.0/node_modules/depd/index.js
var require_depd2 = __commonJS((exports2, module2) => {
  /*!
   * depd
   * Copyright(c) 2014-2018 Douglas Christopher Wilson
   * MIT Licensed
   */
  var relative = require("path").relative;
  module2.exports = depd;
  var basePath = process.cwd();
  function containsNamespace(str, namespace) {
    var vals = str.split(/[ ,]+/);
    var ns = String(namespace).toLowerCase();
    for (var i = 0;i < vals.length; i++) {
      var val = vals[i];
      if (val && (val === "*" || val.toLowerCase() === ns)) {
        return true;
      }
    }
    return false;
  }
  function convertDataDescriptorToAccessor(obj, prop, message2) {
    var descriptor = Object.getOwnPropertyDescriptor(obj, prop);
    var value = descriptor.value;
    descriptor.get = function getter() {
      return value;
    };
    if (descriptor.writable) {
      descriptor.set = function setter(val) {
        return value = val;
      };
    }
    delete descriptor.value;
    delete descriptor.writable;
    Object.defineProperty(obj, prop, descriptor);
    return descriptor;
  }
  function createArgumentsString(arity) {
    var str = "";
    for (var i = 0;i < arity; i++) {
      str += ", arg" + i;
    }
    return str.substr(2);
  }
  function createStackString(stack2) {
    var str = this.name + ": " + this.namespace;
    if (this.message) {
      str += " deprecated " + this.message;
    }
    for (var i = 0;i < stack2.length; i++) {
      str += `
    at ` + stack2[i].toString();
    }
    return str;
  }
  function depd(namespace) {
    if (!namespace) {
      throw new TypeError("argument namespace is required");
    }
    var stack2 = getStack();
    var site2 = callSiteLocation(stack2[1]);
    var file = site2[0];
    function deprecate2(message2) {
      log.call(deprecate2, message2);
    }
    deprecate2._file = file;
    deprecate2._ignored = isignored(namespace);
    deprecate2._namespace = namespace;
    deprecate2._traced = istraced(namespace);
    deprecate2._warned = Object.create(null);
    deprecate2.function = wrapfunction;
    deprecate2.property = wrapproperty;
    return deprecate2;
  }
  function eehaslisteners(emitter, type) {
    var count = typeof emitter.listenerCount !== "function" ? emitter.listeners(type).length : emitter.listenerCount(type);
    return count > 0;
  }
  function isignored(namespace) {
    if (process.noDeprecation) {
      return true;
    }
    var str = process.env.NO_DEPRECATION || "";
    return containsNamespace(str, namespace);
  }
  function istraced(namespace) {
    if (process.traceDeprecation) {
      return true;
    }
    var str = process.env.TRACE_DEPRECATION || "";
    return containsNamespace(str, namespace);
  }
  function log(message2, site2) {
    var haslisteners = eehaslisteners(process, "deprecation");
    if (!haslisteners && this._ignored) {
      return;
    }
    var caller;
    var callFile;
    var callSite;
    var depSite;
    var i = 0;
    var seen = false;
    var stack2 = getStack();
    var file = this._file;
    if (site2) {
      depSite = site2;
      callSite = callSiteLocation(stack2[1]);
      callSite.name = depSite.name;
      file = callSite[0];
    } else {
      i = 2;
      depSite = callSiteLocation(stack2[i]);
      callSite = depSite;
    }
    for (;i < stack2.length; i++) {
      caller = callSiteLocation(stack2[i]);
      callFile = caller[0];
      if (callFile === file) {
        seen = true;
      } else if (callFile === this._file) {
        file = this._file;
      } else if (seen) {
        break;
      }
    }
    var key = caller ? depSite.join(":") + "__" + caller.join(":") : undefined;
    if (key !== undefined && key in this._warned) {
      return;
    }
    this._warned[key] = true;
    var msg = message2;
    if (!msg) {
      msg = callSite === depSite || !callSite.name ? defaultMessage(depSite) : defaultMessage(callSite);
    }
    if (haslisteners) {
      var err = DeprecationError(this._namespace, msg, stack2.slice(i));
      process.emit("deprecation", err);
      return;
    }
    var format = process.stderr.isTTY ? formatColor : formatPlain;
    var output = format.call(this, msg, caller, stack2.slice(i));
    process.stderr.write(output + `
`, "utf8");
  }
  function callSiteLocation(callSite) {
    var file = callSite.getFileName() || "<anonymous>";
    var line = callSite.getLineNumber();
    var colm = callSite.getColumnNumber();
    if (callSite.isEval()) {
      file = callSite.getEvalOrigin() + ", " + file;
    }
    var site2 = [file, line, colm];
    site2.callSite = callSite;
    site2.name = callSite.getFunctionName();
    return site2;
  }
  function defaultMessage(site2) {
    var callSite = site2.callSite;
    var funcName = site2.name;
    if (!funcName) {
      funcName = "<anonymous@" + formatLocation(site2) + ">";
    }
    var context = callSite.getThis();
    var typeName = context && callSite.getTypeName();
    if (typeName === "Object") {
      typeName = undefined;
    }
    if (typeName === "Function") {
      typeName = context.name || typeName;
    }
    return typeName && callSite.getMethodName() ? typeName + "." + funcName : funcName;
  }
  function formatPlain(msg, caller, stack2) {
    var timestamp = new Date().toUTCString();
    var formatted = timestamp + " " + this._namespace + " deprecated " + msg;
    if (this._traced) {
      for (var i = 0;i < stack2.length; i++) {
        formatted += `
    at ` + stack2[i].toString();
      }
      return formatted;
    }
    if (caller) {
      formatted += " at " + formatLocation(caller);
    }
    return formatted;
  }
  function formatColor(msg, caller, stack2) {
    var formatted = "\x1B[36;1m" + this._namespace + "\x1B[22;39m" + " \x1B[33;1mdeprecated\x1B[22;39m" + " \x1B[0m" + msg + "\x1B[39m";
    if (this._traced) {
      for (var i = 0;i < stack2.length; i++) {
        formatted += `
    \x1B[36mat ` + stack2[i].toString() + "\x1B[39m";
      }
      return formatted;
    }
    if (caller) {
      formatted += " \x1B[36m" + formatLocation(caller) + "\x1B[39m";
    }
    return formatted;
  }
  function formatLocation(callSite) {
    return relative(basePath, callSite[0]) + ":" + callSite[1] + ":" + callSite[2];
  }
  function getStack() {
    var limit = Error.stackTraceLimit;
    var obj = {};
    var prep = Error.prepareStackTrace;
    Error.prepareStackTrace = prepareObjectStackTrace;
    Error.stackTraceLimit = Math.max(10, limit);
    Error.captureStackTrace(obj);
    var stack2 = obj.stack.slice(1);
    Error.prepareStackTrace = prep;
    Error.stackTraceLimit = limit;
    return stack2;
  }
  function prepareObjectStackTrace(obj, stack2) {
    return stack2;
  }
  function wrapfunction(fn2, message2) {
    if (typeof fn2 !== "function") {
      throw new TypeError("argument fn must be a function");
    }
    var args2 = createArgumentsString(fn2.length);
    var stack2 = getStack();
    var site2 = callSiteLocation(stack2[1]);
    site2.name = fn2.name;
    var deprecatedfn2 = new Function("fn", "log", "deprecate", "message", "site", `"use strict"
` + "return function (" + args2 + ") {" + `log.call(deprecate, message, site)
` + `return fn.apply(this, arguments)
` + "}")(fn2, log, this, message2, site2);
    return deprecatedfn2;
  }
  function wrapproperty(obj, prop, message2) {
    if (!obj || typeof obj !== "object" && typeof obj !== "function") {
      throw new TypeError("argument obj must be object");
    }
    var descriptor = Object.getOwnPropertyDescriptor(obj, prop);
    if (!descriptor) {
      throw new TypeError("must call property on owner object");
    }
    if (!descriptor.configurable) {
      throw new TypeError("property must be configurable");
    }
    var deprecate2 = this;
    var stack2 = getStack();
    var site2 = callSiteLocation(stack2[1]);
    site2.name = prop;
    if ("value" in descriptor) {
      descriptor = convertDataDescriptorToAccessor(obj, prop, message2);
    }
    var get = descriptor.get;
    var set = descriptor.set;
    if (typeof get === "function") {
      descriptor.get = function getter() {
        log.call(deprecate2, message2, site2);
        return get.apply(this, arguments);
      };
    }
    if (typeof set === "function") {
      descriptor.set = function setter() {
        log.call(deprecate2, message2, site2);
        return set.apply(this, arguments);
      };
    }
    Object.defineProperty(obj, prop, descriptor);
  }
  function DeprecationError(namespace, message2, stack2) {
    var error = new Error;
    var stackString;
    Object.defineProperty(error, "constructor", {
      value: DeprecationError
    });
    Object.defineProperty(error, "message", {
      configurable: true,
      enumerable: false,
      value: message2,
      writable: true
    });
    Object.defineProperty(error, "name", {
      enumerable: false,
      configurable: true,
      value: "DeprecationError",
      writable: true
    });
    Object.defineProperty(error, "namespace", {
      configurable: true,
      enumerable: false,
      value: namespace,
      writable: true
    });
    Object.defineProperty(error, "stack", {
      configurable: true,
      enumerable: false,
      get: function() {
        if (stackString !== undefined) {
          return stackString;
        }
        return stackString = createStackString.call(this, stack2);
      },
      set: function setter(val) {
        stackString = val;
      }
    });
    return error;
  }
});

// node_modules/.bun/tsscmp@1.0.6/node_modules/tsscmp/lib/index.js
var require_lib = __commonJS((exports2, module2) => {
  var crypto = require("crypto");
  function bufferEqual(a, b) {
    if (a.length !== b.length) {
      return false;
    }
    if (crypto.timingSafeEqual) {
      return crypto.timingSafeEqual(a, b);
    }
    for (var i = 0;i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  }
  function timeSafeCompare(a, b) {
    var sa = String(a);
    var sb = String(b);
    var key = crypto.pseudoRandomBytes(32);
    var ah = crypto.createHmac("sha256", key).update(sa).digest();
    var bh = crypto.createHmac("sha256", key).update(sb).digest();
    return bufferEqual(ah, bh) && a === b;
  }
  module2.exports = timeSafeCompare;
});

// node_modules/.bun/keygrip@1.1.0/node_modules/keygrip/index.js
var require_keygrip = __commonJS((exports2, module2) => {
  /*!
   * keygrip
   * Copyright(c) 2011-2014 Jed Schmidt
   * MIT Licensed
   */
  var compare = require_lib();
  var crypto = require("crypto");
  function Keygrip(keys, algorithm, encoding) {
    if (!algorithm)
      algorithm = "sha1";
    if (!encoding)
      encoding = "base64";
    if (!(this instanceof Keygrip))
      return new Keygrip(keys, algorithm, encoding);
    if (!keys || !(0 in keys)) {
      throw new Error("Keys must be provided.");
    }
    function sign(data, key) {
      return crypto.createHmac(algorithm, key).update(data).digest(encoding).replace(/\/|\+|=/g, function(x) {
        return { "/": "_", "+": "-", "=": "" }[x];
      });
    }
    this.sign = function(data) {
      return sign(data, keys[0]);
    };
    this.verify = function(data, digest) {
      return this.index(data, digest) > -1;
    };
    this.index = function(data, digest) {
      for (var i = 0, l = keys.length;i < l; i++) {
        if (compare(digest, sign(data, keys[i]))) {
          return i;
        }
      }
      return -1;
    };
  }
  Keygrip.sign = Keygrip.verify = Keygrip.index = function() {
    throw new Error("Usage: require('keygrip')(<array-of-keys>)");
  };
  module2.exports = Keygrip;
});

// node_modules/.bun/cookies@0.9.1/node_modules/cookies/index.js
var require_cookies = __commonJS((exports2, module2) => {
  /*!
   * cookies
   * Copyright(c) 2014 Jed Schmidt, http://jed.is/
   * Copyright(c) 2015-2016 Douglas Christopher Wilson
   * MIT Licensed
   */
  var deprecate2 = require_depd2()("cookies");
  var Keygrip = require_keygrip();
  var http = require("http");
  var fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;
  var PRIORITY_REGEXP = /^(?:low|medium|high)$/i;
  var REGEXP_CACHE = Object.create(null);
  var REGEXP_ESCAPE_CHARS_REGEXP = /[\^$\\.*+?()[\]{}|]/g;
  var RESTRICTED_NAME_CHARS_REGEXP = /[;=]/;
  var RESTRICTED_VALUE_CHARS_REGEXP = /[;]/;
  var SAME_SITE_REGEXP = /^(?:lax|none|strict)$/i;
  function Cookies(request, response, options) {
    if (!(this instanceof Cookies))
      return new Cookies(request, response, options);
    this.secure = undefined;
    this.request = request;
    this.response = response;
    if (options) {
      if (Array.isArray(options)) {
        deprecate2('"keys" argument; provide using options {"keys": [...]}');
        this.keys = new Keygrip(options);
      } else if (options.constructor && options.constructor.name === "Keygrip") {
        deprecate2('"keys" argument; provide using options {"keys": keygrip}');
        this.keys = options;
      } else {
        this.keys = Array.isArray(options.keys) ? new Keygrip(options.keys) : options.keys;
        this.secure = options.secure;
      }
    }
  }
  Cookies.prototype.get = function(name, opts) {
    var sigName = name + ".sig", header, match, value, remote, data, index, signed = opts && opts.signed !== undefined ? opts.signed : !!this.keys;
    header = this.request.headers["cookie"];
    if (!header)
      return;
    match = header.match(getPattern(name));
    if (!match)
      return;
    value = match[1];
    if (value[0] === '"')
      value = value.slice(1, -1);
    if (!opts || !signed)
      return value;
    remote = this.get(sigName);
    if (!remote)
      return;
    data = name + "=" + value;
    if (!this.keys)
      throw new Error(".keys required for signed cookies");
    index = this.keys.index(data, remote);
    if (index < 0) {
      this.set(sigName, null, { path: "/", signed: false });
    } else {
      index && this.set(sigName, this.keys.sign(data), { signed: false });
      return value;
    }
  };
  Cookies.prototype.set = function(name, value, opts) {
    var res = this.response, req = this.request, headers = res.getHeader("Set-Cookie") || [], cookie = new Cookie(name, value, opts), signed = opts && opts.signed !== undefined ? opts.signed : !!this.keys;
    var secure = this.secure === undefined ? req.protocol === "https" || isRequestEncrypted(req) : Boolean(this.secure);
    if (typeof headers == "string")
      headers = [headers];
    if (!secure && opts && opts.secure) {
      throw new Error("Cannot send secure cookie over unencrypted connection");
    }
    cookie.secure = opts && opts.secure !== undefined ? opts.secure : secure;
    if (opts && "secureProxy" in opts) {
      deprecate2('"secureProxy" option; use "secure" option, provide "secure" to constructor if needed');
      cookie.secure = opts.secureProxy;
    }
    pushCookie(headers, cookie);
    if (opts && signed) {
      if (!this.keys)
        throw new Error(".keys required for signed cookies");
      cookie.value = this.keys.sign(cookie.toString());
      cookie.name += ".sig";
      pushCookie(headers, cookie);
    }
    var setHeader = res.set ? http.OutgoingMessage.prototype.setHeader : res.setHeader;
    setHeader.call(res, "Set-Cookie", headers);
    return this;
  };
  function Cookie(name, value, attrs) {
    if (!fieldContentRegExp.test(name) || RESTRICTED_NAME_CHARS_REGEXP.test(name)) {
      throw new TypeError("argument name is invalid");
    }
    if (value && (!fieldContentRegExp.test(value) || RESTRICTED_VALUE_CHARS_REGEXP.test(value))) {
      throw new TypeError("argument value is invalid");
    }
    this.name = name;
    this.value = value || "";
    for (var name in attrs) {
      this[name] = attrs[name];
    }
    if (!this.value) {
      this.expires = new Date(0);
      this.maxAge = null;
    }
    if (this.path && !fieldContentRegExp.test(this.path)) {
      throw new TypeError("option path is invalid");
    }
    if (this.domain && !fieldContentRegExp.test(this.domain)) {
      throw new TypeError("option domain is invalid");
    }
    if (typeof this.maxAge === "number" ? isNaN(this.maxAge) || !isFinite(this.maxAge) : this.maxAge) {
      throw new TypeError("option maxAge is invalid");
    }
    if (this.priority && !PRIORITY_REGEXP.test(this.priority)) {
      throw new TypeError("option priority is invalid");
    }
    if (this.sameSite && this.sameSite !== true && !SAME_SITE_REGEXP.test(this.sameSite)) {
      throw new TypeError("option sameSite is invalid");
    }
  }
  Cookie.prototype.path = "/";
  Cookie.prototype.expires = undefined;
  Cookie.prototype.domain = undefined;
  Cookie.prototype.httpOnly = true;
  Cookie.prototype.partitioned = false;
  Cookie.prototype.priority = undefined;
  Cookie.prototype.sameSite = false;
  Cookie.prototype.secure = false;
  Cookie.prototype.overwrite = false;
  Cookie.prototype.toString = function() {
    return this.name + "=" + this.value;
  };
  Cookie.prototype.toHeader = function() {
    var header = this.toString();
    if (this.maxAge)
      this.expires = new Date(Date.now() + this.maxAge);
    if (this.path)
      header += "; path=" + this.path;
    if (this.expires)
      header += "; expires=" + this.expires.toUTCString();
    if (this.domain)
      header += "; domain=" + this.domain;
    if (this.priority)
      header += "; priority=" + this.priority.toLowerCase();
    if (this.sameSite)
      header += "; samesite=" + (this.sameSite === true ? "strict" : this.sameSite.toLowerCase());
    if (this.secure)
      header += "; secure";
    if (this.httpOnly)
      header += "; httponly";
    if (this.partitioned)
      header += "; partitioned";
    return header;
  };
  Object.defineProperty(Cookie.prototype, "maxage", {
    configurable: true,
    enumerable: true,
    get: function() {
      return this.maxAge;
    },
    set: function(val) {
      return this.maxAge = val;
    }
  });
  deprecate2.property(Cookie.prototype, "maxage", '"maxage"; use "maxAge" instead');
  function getPattern(name) {
    if (!REGEXP_CACHE[name]) {
      REGEXP_CACHE[name] = new RegExp("(?:^|;) *" + name.replace(REGEXP_ESCAPE_CHARS_REGEXP, "\\$&") + "=([^;]*)");
    }
    return REGEXP_CACHE[name];
  }
  function isRequestEncrypted(req) {
    return req.socket ? req.socket.encrypted : req.connection.encrypted;
  }
  function pushCookie(headers, cookie) {
    if (cookie.overwrite) {
      for (var i = headers.length - 1;i >= 0; i--) {
        if (headers[i].indexOf(cookie.name + "=") === 0) {
          headers.splice(i, 1);
        }
      }
    }
    headers.push(cookie.toHeader());
  }
  Cookies.connect = Cookies.express = function(keys) {
    return function(req, res, next) {
      req.cookies = res.cookies = new Cookies(req, res, {
        keys
      });
      next();
    };
  };
  Cookies.Cookie = Cookie;
  module2.exports = Cookies;
});

// node_modules/.bun/koa@2.16.4/node_modules/koa/lib/context.js
var require_context = __commonJS((exports2, module2) => {
  var util = require("util");
  var createError = require_http_errors();
  var httpAssert = require_http_assert();
  var delegate = require_delegates();
  var statuses = require_statuses();
  var Cookies = require_cookies();
  var COOKIES = Symbol("context#cookies");
  var proto = module2.exports = {
    inspect() {
      if (this === proto)
        return this;
      return this.toJSON();
    },
    toJSON() {
      return {
        request: this.request.toJSON(),
        response: this.response.toJSON(),
        app: this.app.toJSON(),
        originalUrl: this.originalUrl,
        req: "<original node req>",
        res: "<original node res>",
        socket: "<original node socket>"
      };
    },
    assert: httpAssert,
    throw(...args2) {
      throw createError(...args2);
    },
    onerror(err) {
      if (err == null)
        return;
      const isNativeError = Object.prototype.toString.call(err) === "[object Error]" || err instanceof Error;
      if (!isNativeError)
        err = new Error(util.format("non-error thrown: %j", err));
      let headerSent = false;
      if (this.headerSent || !this.writable) {
        headerSent = err.headerSent = true;
      }
      this.app.emit("error", err, this);
      if (headerSent) {
        return;
      }
      const { res } = this;
      if (typeof res.getHeaderNames === "function") {
        res.getHeaderNames().forEach((name) => res.removeHeader(name));
      } else {
        res._headers = {};
      }
      this.set(err.headers);
      this.type = "text";
      let statusCode = err.status || err.statusCode;
      if (err.code === "ENOENT")
        statusCode = 404;
      if (typeof statusCode !== "number" || !statuses[statusCode])
        statusCode = 500;
      const code = statuses[statusCode];
      const msg = err.expose ? err.message : code;
      this.status = err.status = statusCode;
      this.length = Buffer.byteLength(msg);
      res.end(msg);
    },
    get cookies() {
      if (!this[COOKIES]) {
        this[COOKIES] = new Cookies(this.req, this.res, {
          keys: this.app.keys,
          secure: this.request.secure
        });
      }
      return this[COOKIES];
    },
    set cookies(_cookies) {
      this[COOKIES] = _cookies;
    }
  };
  if (util.inspect.custom) {
    module2.exports[util.inspect.custom] = module2.exports.inspect;
  }
  delegate(proto, "response").method("attachment").method("redirect").method("remove").method("vary").method("has").method("set").method("append").method("flushHeaders").access("status").access("message").access("body").access("length").access("type").access("lastModified").access("etag").getter("headerSent").getter("writable");
  delegate(proto, "request").method("acceptsLanguages").method("acceptsEncodings").method("acceptsCharsets").method("accepts").method("get").method("is").access("querystring").access("idempotent").access("socket").access("search").access("method").access("query").access("path").access("url").access("accept").getter("origin").getter("href").getter("subdomains").getter("protocol").getter("host").getter("hostname").getter("URL").getter("header").getter("headers").getter("secure").getter("stale").getter("fresh").getter("ips").getter("ip");
});

// node_modules/.bun/negotiator@0.6.3/node_modules/negotiator/lib/charset.js
var require_charset = __commonJS((exports2, module2) => {
  module2.exports = preferredCharsets;
  module2.exports.preferredCharsets = preferredCharsets;
  var simpleCharsetRegExp = /^\s*([^\s;]+)\s*(?:;(.*))?$/;
  function parseAcceptCharset(accept) {
    var accepts = accept.split(",");
    for (var i = 0, j = 0;i < accepts.length; i++) {
      var charset = parseCharset(accepts[i].trim(), i);
      if (charset) {
        accepts[j++] = charset;
      }
    }
    accepts.length = j;
    return accepts;
  }
  function parseCharset(str, i) {
    var match = simpleCharsetRegExp.exec(str);
    if (!match)
      return null;
    var charset = match[1];
    var q = 1;
    if (match[2]) {
      var params = match[2].split(";");
      for (var j = 0;j < params.length; j++) {
        var p = params[j].trim().split("=");
        if (p[0] === "q") {
          q = parseFloat(p[1]);
          break;
        }
      }
    }
    return {
      charset,
      q,
      i
    };
  }
  function getCharsetPriority(charset, accepted, index) {
    var priority = { o: -1, q: 0, s: 0 };
    for (var i = 0;i < accepted.length; i++) {
      var spec = specify(charset, accepted[i], index);
      if (spec && (priority.s - spec.s || priority.q - spec.q || priority.o - spec.o) < 0) {
        priority = spec;
      }
    }
    return priority;
  }
  function specify(charset, spec, index) {
    var s = 0;
    if (spec.charset.toLowerCase() === charset.toLowerCase()) {
      s |= 1;
    } else if (spec.charset !== "*") {
      return null;
    }
    return {
      i: index,
      o: spec.i,
      q: spec.q,
      s
    };
  }
  function preferredCharsets(accept, provided) {
    var accepts = parseAcceptCharset(accept === undefined ? "*" : accept || "");
    if (!provided) {
      return accepts.filter(isQuality).sort(compareSpecs).map(getFullCharset);
    }
    var priorities = provided.map(function getPriority(type, index) {
      return getCharsetPriority(type, accepts, index);
    });
    return priorities.filter(isQuality).sort(compareSpecs).map(function getCharset(priority) {
      return provided[priorities.indexOf(priority)];
    });
  }
  function compareSpecs(a, b) {
    return b.q - a.q || b.s - a.s || a.o - b.o || a.i - b.i || 0;
  }
  function getFullCharset(spec) {
    return spec.charset;
  }
  function isQuality(spec) {
    return spec.q > 0;
  }
});

// node_modules/.bun/negotiator@0.6.3/node_modules/negotiator/lib/encoding.js
var require_encoding = __commonJS((exports2, module2) => {
  module2.exports = preferredEncodings;
  module2.exports.preferredEncodings = preferredEncodings;
  var simpleEncodingRegExp = /^\s*([^\s;]+)\s*(?:;(.*))?$/;
  function parseAcceptEncoding(accept) {
    var accepts = accept.split(",");
    var hasIdentity = false;
    var minQuality = 1;
    for (var i = 0, j = 0;i < accepts.length; i++) {
      var encoding = parseEncoding(accepts[i].trim(), i);
      if (encoding) {
        accepts[j++] = encoding;
        hasIdentity = hasIdentity || specify("identity", encoding);
        minQuality = Math.min(minQuality, encoding.q || 1);
      }
    }
    if (!hasIdentity) {
      accepts[j++] = {
        encoding: "identity",
        q: minQuality,
        i
      };
    }
    accepts.length = j;
    return accepts;
  }
  function parseEncoding(str, i) {
    var match = simpleEncodingRegExp.exec(str);
    if (!match)
      return null;
    var encoding = match[1];
    var q = 1;
    if (match[2]) {
      var params = match[2].split(";");
      for (var j = 0;j < params.length; j++) {
        var p = params[j].trim().split("=");
        if (p[0] === "q") {
          q = parseFloat(p[1]);
          break;
        }
      }
    }
    return {
      encoding,
      q,
      i
    };
  }
  function getEncodingPriority(encoding, accepted, index) {
    var priority = { o: -1, q: 0, s: 0 };
    for (var i = 0;i < accepted.length; i++) {
      var spec = specify(encoding, accepted[i], index);
      if (spec && (priority.s - spec.s || priority.q - spec.q || priority.o - spec.o) < 0) {
        priority = spec;
      }
    }
    return priority;
  }
  function specify(encoding, spec, index) {
    var s = 0;
    if (spec.encoding.toLowerCase() === encoding.toLowerCase()) {
      s |= 1;
    } else if (spec.encoding !== "*") {
      return null;
    }
    return {
      i: index,
      o: spec.i,
      q: spec.q,
      s
    };
  }
  function preferredEncodings(accept, provided) {
    var accepts = parseAcceptEncoding(accept || "");
    if (!provided) {
      return accepts.filter(isQuality).sort(compareSpecs).map(getFullEncoding);
    }
    var priorities = provided.map(function getPriority(type, index) {
      return getEncodingPriority(type, accepts, index);
    });
    return priorities.filter(isQuality).sort(compareSpecs).map(function getEncoding(priority) {
      return provided[priorities.indexOf(priority)];
    });
  }
  function compareSpecs(a, b) {
    return b.q - a.q || b.s - a.s || a.o - b.o || a.i - b.i || 0;
  }
  function getFullEncoding(spec) {
    return spec.encoding;
  }
  function isQuality(spec) {
    return spec.q > 0;
  }
});

// node_modules/.bun/negotiator@0.6.3/node_modules/negotiator/lib/language.js
var require_language = __commonJS((exports2, module2) => {
  module2.exports = preferredLanguages;
  module2.exports.preferredLanguages = preferredLanguages;
  var simpleLanguageRegExp = /^\s*([^\s\-;]+)(?:-([^\s;]+))?\s*(?:;(.*))?$/;
  function parseAcceptLanguage(accept) {
    var accepts = accept.split(",");
    for (var i = 0, j = 0;i < accepts.length; i++) {
      var language = parseLanguage(accepts[i].trim(), i);
      if (language) {
        accepts[j++] = language;
      }
    }
    accepts.length = j;
    return accepts;
  }
  function parseLanguage(str, i) {
    var match = simpleLanguageRegExp.exec(str);
    if (!match)
      return null;
    var prefix = match[1];
    var suffix = match[2];
    var full = prefix;
    if (suffix)
      full += "-" + suffix;
    var q = 1;
    if (match[3]) {
      var params = match[3].split(";");
      for (var j = 0;j < params.length; j++) {
        var p = params[j].split("=");
        if (p[0] === "q")
          q = parseFloat(p[1]);
      }
    }
    return {
      prefix,
      suffix,
      q,
      i,
      full
    };
  }
  function getLanguagePriority(language, accepted, index) {
    var priority = { o: -1, q: 0, s: 0 };
    for (var i = 0;i < accepted.length; i++) {
      var spec = specify(language, accepted[i], index);
      if (spec && (priority.s - spec.s || priority.q - spec.q || priority.o - spec.o) < 0) {
        priority = spec;
      }
    }
    return priority;
  }
  function specify(language, spec, index) {
    var p = parseLanguage(language);
    if (!p)
      return null;
    var s = 0;
    if (spec.full.toLowerCase() === p.full.toLowerCase()) {
      s |= 4;
    } else if (spec.prefix.toLowerCase() === p.full.toLowerCase()) {
      s |= 2;
    } else if (spec.full.toLowerCase() === p.prefix.toLowerCase()) {
      s |= 1;
    } else if (spec.full !== "*") {
      return null;
    }
    return {
      i: index,
      o: spec.i,
      q: spec.q,
      s
    };
  }
  function preferredLanguages(accept, provided) {
    var accepts = parseAcceptLanguage(accept === undefined ? "*" : accept || "");
    if (!provided) {
      return accepts.filter(isQuality).sort(compareSpecs).map(getFullLanguage);
    }
    var priorities = provided.map(function getPriority(type, index) {
      return getLanguagePriority(type, accepts, index);
    });
    return priorities.filter(isQuality).sort(compareSpecs).map(function getLanguage(priority) {
      return provided[priorities.indexOf(priority)];
    });
  }
  function compareSpecs(a, b) {
    return b.q - a.q || b.s - a.s || a.o - b.o || a.i - b.i || 0;
  }
  function getFullLanguage(spec) {
    return spec.full;
  }
  function isQuality(spec) {
    return spec.q > 0;
  }
});

// node_modules/.bun/negotiator@0.6.3/node_modules/negotiator/lib/mediaType.js
var require_mediaType = __commonJS((exports2, module2) => {
  module2.exports = preferredMediaTypes;
  module2.exports.preferredMediaTypes = preferredMediaTypes;
  var simpleMediaTypeRegExp = /^\s*([^\s\/;]+)\/([^;\s]+)\s*(?:;(.*))?$/;
  function parseAccept(accept) {
    var accepts = splitMediaTypes(accept);
    for (var i = 0, j = 0;i < accepts.length; i++) {
      var mediaType = parseMediaType(accepts[i].trim(), i);
      if (mediaType) {
        accepts[j++] = mediaType;
      }
    }
    accepts.length = j;
    return accepts;
  }
  function parseMediaType(str, i) {
    var match = simpleMediaTypeRegExp.exec(str);
    if (!match)
      return null;
    var params = Object.create(null);
    var q = 1;
    var subtype = match[2];
    var type = match[1];
    if (match[3]) {
      var kvps = splitParameters(match[3]).map(splitKeyValuePair);
      for (var j = 0;j < kvps.length; j++) {
        var pair = kvps[j];
        var key = pair[0].toLowerCase();
        var val = pair[1];
        var value = val && val[0] === '"' && val[val.length - 1] === '"' ? val.substr(1, val.length - 2) : val;
        if (key === "q") {
          q = parseFloat(value);
          break;
        }
        params[key] = value;
      }
    }
    return {
      type,
      subtype,
      params,
      q,
      i
    };
  }
  function getMediaTypePriority(type, accepted, index) {
    var priority = { o: -1, q: 0, s: 0 };
    for (var i = 0;i < accepted.length; i++) {
      var spec = specify(type, accepted[i], index);
      if (spec && (priority.s - spec.s || priority.q - spec.q || priority.o - spec.o) < 0) {
        priority = spec;
      }
    }
    return priority;
  }
  function specify(type, spec, index) {
    var p = parseMediaType(type);
    var s = 0;
    if (!p) {
      return null;
    }
    if (spec.type.toLowerCase() == p.type.toLowerCase()) {
      s |= 4;
    } else if (spec.type != "*") {
      return null;
    }
    if (spec.subtype.toLowerCase() == p.subtype.toLowerCase()) {
      s |= 2;
    } else if (spec.subtype != "*") {
      return null;
    }
    var keys = Object.keys(spec.params);
    if (keys.length > 0) {
      if (keys.every(function(k) {
        return spec.params[k] == "*" || (spec.params[k] || "").toLowerCase() == (p.params[k] || "").toLowerCase();
      })) {
        s |= 1;
      } else {
        return null;
      }
    }
    return {
      i: index,
      o: spec.i,
      q: spec.q,
      s
    };
  }
  function preferredMediaTypes(accept, provided) {
    var accepts = parseAccept(accept === undefined ? "*/*" : accept || "");
    if (!provided) {
      return accepts.filter(isQuality).sort(compareSpecs).map(getFullType);
    }
    var priorities = provided.map(function getPriority(type, index) {
      return getMediaTypePriority(type, accepts, index);
    });
    return priorities.filter(isQuality).sort(compareSpecs).map(function getType(priority) {
      return provided[priorities.indexOf(priority)];
    });
  }
  function compareSpecs(a, b) {
    return b.q - a.q || b.s - a.s || a.o - b.o || a.i - b.i || 0;
  }
  function getFullType(spec) {
    return spec.type + "/" + spec.subtype;
  }
  function isQuality(spec) {
    return spec.q > 0;
  }
  function quoteCount(string) {
    var count = 0;
    var index = 0;
    while ((index = string.indexOf('"', index)) !== -1) {
      count++;
      index++;
    }
    return count;
  }
  function splitKeyValuePair(str) {
    var index = str.indexOf("=");
    var key;
    var val;
    if (index === -1) {
      key = str;
    } else {
      key = str.substr(0, index);
      val = str.substr(index + 1);
    }
    return [key, val];
  }
  function splitMediaTypes(accept) {
    var accepts = accept.split(",");
    for (var i = 1, j = 0;i < accepts.length; i++) {
      if (quoteCount(accepts[j]) % 2 == 0) {
        accepts[++j] = accepts[i];
      } else {
        accepts[j] += "," + accepts[i];
      }
    }
    accepts.length = j + 1;
    return accepts;
  }
  function splitParameters(str) {
    var parameters = str.split(";");
    for (var i = 1, j = 0;i < parameters.length; i++) {
      if (quoteCount(parameters[j]) % 2 == 0) {
        parameters[++j] = parameters[i];
      } else {
        parameters[j] += ";" + parameters[i];
      }
    }
    parameters.length = j + 1;
    for (var i = 0;i < parameters.length; i++) {
      parameters[i] = parameters[i].trim();
    }
    return parameters;
  }
});

// node_modules/.bun/negotiator@0.6.3/node_modules/negotiator/index.js
var require_negotiator = __commonJS((exports2, module2) => {
  /*!
   * negotiator
   * Copyright(c) 2012 Federico Romero
   * Copyright(c) 2012-2014 Isaac Z. Schlueter
   * Copyright(c) 2015 Douglas Christopher Wilson
   * MIT Licensed
   */
  var preferredCharsets = require_charset();
  var preferredEncodings = require_encoding();
  var preferredLanguages = require_language();
  var preferredMediaTypes = require_mediaType();
  module2.exports = Negotiator;
  module2.exports.Negotiator = Negotiator;
  function Negotiator(request) {
    if (!(this instanceof Negotiator)) {
      return new Negotiator(request);
    }
    this.request = request;
  }
  Negotiator.prototype.charset = function charset(available) {
    var set = this.charsets(available);
    return set && set[0];
  };
  Negotiator.prototype.charsets = function charsets(available) {
    return preferredCharsets(this.request.headers["accept-charset"], available);
  };
  Negotiator.prototype.encoding = function encoding(available) {
    var set = this.encodings(available);
    return set && set[0];
  };
  Negotiator.prototype.encodings = function encodings(available) {
    return preferredEncodings(this.request.headers["accept-encoding"], available);
  };
  Negotiator.prototype.language = function language(available) {
    var set = this.languages(available);
    return set && set[0];
  };
  Negotiator.prototype.languages = function languages(available) {
    return preferredLanguages(this.request.headers["accept-language"], available);
  };
  Negotiator.prototype.mediaType = function mediaType(available) {
    var set = this.mediaTypes(available);
    return set && set[0];
  };
  Negotiator.prototype.mediaTypes = function mediaTypes(available) {
    return preferredMediaTypes(this.request.headers.accept, available);
  };
  Negotiator.prototype.preferredCharset = Negotiator.prototype.charset;
  Negotiator.prototype.preferredCharsets = Negotiator.prototype.charsets;
  Negotiator.prototype.preferredEncoding = Negotiator.prototype.encoding;
  Negotiator.prototype.preferredEncodings = Negotiator.prototype.encodings;
  Negotiator.prototype.preferredLanguage = Negotiator.prototype.language;
  Negotiator.prototype.preferredLanguages = Negotiator.prototype.languages;
  Negotiator.prototype.preferredMediaType = Negotiator.prototype.mediaType;
  Negotiator.prototype.preferredMediaTypes = Negotiator.prototype.mediaTypes;
});

// node_modules/.bun/accepts@1.3.8/node_modules/accepts/index.js
var require_accepts = __commonJS((exports2, module2) => {
  /*!
   * accepts
   * Copyright(c) 2014 Jonathan Ong
   * Copyright(c) 2015 Douglas Christopher Wilson
   * MIT Licensed
   */
  var Negotiator = require_negotiator();
  var mime = require_mime_types();
  module2.exports = Accepts;
  function Accepts(req) {
    if (!(this instanceof Accepts)) {
      return new Accepts(req);
    }
    this.headers = req.headers;
    this.negotiator = new Negotiator(req);
  }
  Accepts.prototype.type = Accepts.prototype.types = function(types_) {
    var types = types_;
    if (types && !Array.isArray(types)) {
      types = new Array(arguments.length);
      for (var i = 0;i < types.length; i++) {
        types[i] = arguments[i];
      }
    }
    if (!types || types.length === 0) {
      return this.negotiator.mediaTypes();
    }
    if (!this.headers.accept) {
      return types[0];
    }
    var mimes = types.map(extToMime);
    var accepts = this.negotiator.mediaTypes(mimes.filter(validMime));
    var first = accepts[0];
    return first ? types[mimes.indexOf(first)] : false;
  };
  Accepts.prototype.encoding = Accepts.prototype.encodings = function(encodings_) {
    var encodings = encodings_;
    if (encodings && !Array.isArray(encodings)) {
      encodings = new Array(arguments.length);
      for (var i = 0;i < encodings.length; i++) {
        encodings[i] = arguments[i];
      }
    }
    if (!encodings || encodings.length === 0) {
      return this.negotiator.encodings();
    }
    return this.negotiator.encodings(encodings)[0] || false;
  };
  Accepts.prototype.charset = Accepts.prototype.charsets = function(charsets_) {
    var charsets = charsets_;
    if (charsets && !Array.isArray(charsets)) {
      charsets = new Array(arguments.length);
      for (var i = 0;i < charsets.length; i++) {
        charsets[i] = arguments[i];
      }
    }
    if (!charsets || charsets.length === 0) {
      return this.negotiator.charsets();
    }
    return this.negotiator.charsets(charsets)[0] || false;
  };
  Accepts.prototype.lang = Accepts.prototype.langs = Accepts.prototype.language = Accepts.prototype.languages = function(languages_) {
    var languages = languages_;
    if (languages && !Array.isArray(languages)) {
      languages = new Array(arguments.length);
      for (var i = 0;i < languages.length; i++) {
        languages[i] = arguments[i];
      }
    }
    if (!languages || languages.length === 0) {
      return this.negotiator.languages();
    }
    return this.negotiator.languages(languages)[0] || false;
  };
  function extToMime(type) {
    return type.indexOf("/") === -1 ? mime.lookup(type) : type;
  }
  function validMime(type) {
    return typeof type === "string";
  }
});

// node_modules/.bun/content-type@1.0.5/node_modules/content-type/index.js
var require_content_type = __commonJS((exports2) => {
  /*!
   * content-type
   * Copyright(c) 2015 Douglas Christopher Wilson
   * MIT Licensed
   */
  var PARAM_REGEXP = /; *([!#$%&'*+.^_`|~0-9A-Za-z-]+) *= *("(?:[\u000b\u0020\u0021\u0023-\u005b\u005d-\u007e\u0080-\u00ff]|\\[\u000b\u0020-\u00ff])*"|[!#$%&'*+.^_`|~0-9A-Za-z-]+) */g;
  var TEXT_REGEXP = /^[\u000b\u0020-\u007e\u0080-\u00ff]+$/;
  var TOKEN_REGEXP = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
  var QESC_REGEXP = /\\([\u000b\u0020-\u00ff])/g;
  var QUOTE_REGEXP = /([\\"])/g;
  var TYPE_REGEXP = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+\/[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
  exports2.format = format;
  exports2.parse = parse;
  function format(obj) {
    if (!obj || typeof obj !== "object") {
      throw new TypeError("argument obj is required");
    }
    var parameters = obj.parameters;
    var type = obj.type;
    if (!type || !TYPE_REGEXP.test(type)) {
      throw new TypeError("invalid type");
    }
    var string = type;
    if (parameters && typeof parameters === "object") {
      var param;
      var params = Object.keys(parameters).sort();
      for (var i = 0;i < params.length; i++) {
        param = params[i];
        if (!TOKEN_REGEXP.test(param)) {
          throw new TypeError("invalid parameter name");
        }
        string += "; " + param + "=" + qstring(parameters[param]);
      }
    }
    return string;
  }
  function parse(string) {
    if (!string) {
      throw new TypeError("argument string is required");
    }
    var header = typeof string === "object" ? getcontenttype(string) : string;
    if (typeof header !== "string") {
      throw new TypeError("argument string is required to be a string");
    }
    var index = header.indexOf(";");
    var type = index !== -1 ? header.slice(0, index).trim() : header.trim();
    if (!TYPE_REGEXP.test(type)) {
      throw new TypeError("invalid media type");
    }
    var obj = new ContentType(type.toLowerCase());
    if (index !== -1) {
      var key;
      var match;
      var value;
      PARAM_REGEXP.lastIndex = index;
      while (match = PARAM_REGEXP.exec(header)) {
        if (match.index !== index) {
          throw new TypeError("invalid parameter format");
        }
        index += match[0].length;
        key = match[1].toLowerCase();
        value = match[2];
        if (value.charCodeAt(0) === 34) {
          value = value.slice(1, -1);
          if (value.indexOf("\\") !== -1) {
            value = value.replace(QESC_REGEXP, "$1");
          }
        }
        obj.parameters[key] = value;
      }
      if (index !== header.length) {
        throw new TypeError("invalid parameter format");
      }
    }
    return obj;
  }
  function getcontenttype(obj) {
    var header;
    if (typeof obj.getHeader === "function") {
      header = obj.getHeader("content-type");
    } else if (typeof obj.headers === "object") {
      header = obj.headers && obj.headers["content-type"];
    }
    if (typeof header !== "string") {
      throw new TypeError("content-type header is missing from object");
    }
    return header;
  }
  function qstring(val) {
    var str = String(val);
    if (TOKEN_REGEXP.test(str)) {
      return str;
    }
    if (str.length > 0 && !TEXT_REGEXP.test(str)) {
      throw new TypeError("invalid parameter value");
    }
    return '"' + str.replace(QUOTE_REGEXP, "\\$1") + '"';
  }
  function ContentType(type) {
    this.parameters = Object.create(null);
    this.type = type;
  }
});

// node_modules/.bun/parseurl@1.3.3/node_modules/parseurl/index.js
var require_parseurl = __commonJS((exports2, module2) => {
  /*!
   * parseurl
   * Copyright(c) 2014 Jonathan Ong
   * Copyright(c) 2014-2017 Douglas Christopher Wilson
   * MIT Licensed
   */
  var url = require("url");
  var parse = url.parse;
  var Url = url.Url;
  module2.exports = parseurl;
  module2.exports.original = originalurl;
  function parseurl(req) {
    var url2 = req.url;
    if (url2 === undefined) {
      return;
    }
    var parsed = req._parsedUrl;
    if (fresh(url2, parsed)) {
      return parsed;
    }
    parsed = fastparse(url2);
    parsed._raw = url2;
    return req._parsedUrl = parsed;
  }
  function originalurl(req) {
    var url2 = req.originalUrl;
    if (typeof url2 !== "string") {
      return parseurl(req);
    }
    var parsed = req._parsedOriginalUrl;
    if (fresh(url2, parsed)) {
      return parsed;
    }
    parsed = fastparse(url2);
    parsed._raw = url2;
    return req._parsedOriginalUrl = parsed;
  }
  function fastparse(str) {
    if (typeof str !== "string" || str.charCodeAt(0) !== 47) {
      return parse(str);
    }
    var pathname = str;
    var query = null;
    var search = null;
    for (var i = 1;i < str.length; i++) {
      switch (str.charCodeAt(i)) {
        case 63:
          if (search === null) {
            pathname = str.substring(0, i);
            query = str.substring(i + 1);
            search = str.substring(i);
          }
          break;
        case 9:
        case 10:
        case 12:
        case 13:
        case 32:
        case 35:
        case 160:
        case 65279:
          return parse(str);
      }
    }
    var url2 = Url !== undefined ? new Url : {};
    url2.path = str;
    url2.href = str;
    url2.pathname = pathname;
    if (search !== null) {
      url2.query = query;
      url2.search = search;
    }
    return url2;
  }
  function fresh(url2, parsedUrl) {
    return typeof parsedUrl === "object" && parsedUrl !== null && (Url === undefined || parsedUrl instanceof Url) && parsedUrl._raw === url2;
  }
});

// node_modules/.bun/fresh@0.5.2/node_modules/fresh/index.js
var require_fresh = __commonJS((exports2, module2) => {
  /*!
   * fresh
   * Copyright(c) 2012 TJ Holowaychuk
   * Copyright(c) 2016-2017 Douglas Christopher Wilson
   * MIT Licensed
   */
  var CACHE_CONTROL_NO_CACHE_REGEXP = /(?:^|,)\s*?no-cache\s*?(?:,|$)/;
  module2.exports = fresh;
  function fresh(reqHeaders, resHeaders) {
    var modifiedSince = reqHeaders["if-modified-since"];
    var noneMatch = reqHeaders["if-none-match"];
    if (!modifiedSince && !noneMatch) {
      return false;
    }
    var cacheControl = reqHeaders["cache-control"];
    if (cacheControl && CACHE_CONTROL_NO_CACHE_REGEXP.test(cacheControl)) {
      return false;
    }
    if (noneMatch && noneMatch !== "*") {
      var etag = resHeaders["etag"];
      if (!etag) {
        return false;
      }
      var etagStale = true;
      var matches = parseTokenList(noneMatch);
      for (var i = 0;i < matches.length; i++) {
        var match = matches[i];
        if (match === etag || match === "W/" + etag || "W/" + match === etag) {
          etagStale = false;
          break;
        }
      }
      if (etagStale) {
        return false;
      }
    }
    if (modifiedSince) {
      var lastModified = resHeaders["last-modified"];
      var modifiedStale = !lastModified || !(parseHttpDate(lastModified) <= parseHttpDate(modifiedSince));
      if (modifiedStale) {
        return false;
      }
    }
    return true;
  }
  function parseHttpDate(date) {
    var timestamp = date && Date.parse(date);
    return typeof timestamp === "number" ? timestamp : NaN;
  }
  function parseTokenList(str) {
    var end = 0;
    var list = [];
    var start = 0;
    for (var i = 0, len = str.length;i < len; i++) {
      switch (str.charCodeAt(i)) {
        case 32:
          if (start === end) {
            start = end = i + 1;
          }
          break;
        case 44:
          list.push(str.substring(start, end));
          start = end = i + 1;
          break;
        default:
          end = i + 1;
          break;
      }
    }
    list.push(str.substring(start, end));
    return list;
  }
});

// node_modules/.bun/koa@2.16.4/node_modules/koa/lib/request.js
var require_request = __commonJS((exports2, module2) => {
  var URL2 = require("url").URL;
  var net = require("net");
  var accepts = require_accepts();
  var contentType = require_content_type();
  var stringify = require("url").format;
  var parse = require_parseurl();
  var qs = require("querystring");
  var typeis = require_type_is();
  var fresh = require_fresh();
  var only = require_only();
  var util = require("util");
  var IP = Symbol("context#ip");
  module2.exports = {
    get header() {
      return this.req.headers;
    },
    set header(val) {
      this.req.headers = val;
    },
    get headers() {
      return this.req.headers;
    },
    set headers(val) {
      this.req.headers = val;
    },
    get url() {
      return this.req.url;
    },
    set url(val) {
      this.req.url = val;
    },
    get origin() {
      return `${this.protocol}://${this.host}`;
    },
    get href() {
      if (/^https?:\/\//i.test(this.originalUrl))
        return this.originalUrl;
      return this.origin + this.originalUrl;
    },
    get method() {
      return this.req.method;
    },
    set method(val) {
      this.req.method = val;
    },
    get path() {
      return parse(this.req).pathname;
    },
    set path(path) {
      const url = parse(this.req);
      if (url.pathname === path)
        return;
      url.pathname = path;
      url.path = null;
      this.url = stringify(url);
    },
    get query() {
      const str = this.querystring;
      const c = this._querycache = this._querycache || {};
      return c[str] || (c[str] = qs.parse(str));
    },
    set query(obj) {
      this.querystring = qs.stringify(obj);
    },
    get querystring() {
      if (!this.req)
        return "";
      return parse(this.req).query || "";
    },
    set querystring(str) {
      const url = parse(this.req);
      if (url.search === `?${str}`)
        return;
      url.search = str;
      url.path = null;
      this.url = stringify(url);
    },
    get search() {
      if (!this.querystring)
        return "";
      return `?${this.querystring}`;
    },
    set search(str) {
      this.querystring = str;
    },
    get host() {
      const proxy = this.app.proxy;
      let host = proxy && this.get("X-Forwarded-Host");
      if (!host) {
        if (this.req.httpVersionMajor >= 2)
          host = this.get(":authority");
        if (!host)
          host = this.get("Host");
      }
      if (!host)
        return "";
      host = splitCommaSeparatedValues(host, 1)[0];
      if (host.includes("@")) {
        try {
          host = new URL2(`http://${host}`).host;
        } catch (e) {
          return "";
        }
      }
      return host;
    },
    get hostname() {
      const host = this.host;
      if (!host)
        return "";
      if (host[0] === "[")
        return this.URL.hostname || "";
      return host.split(":", 1)[0];
    },
    get URL() {
      if (!this.memoizedURL) {
        const originalUrl = this.originalUrl || "";
        try {
          this.memoizedURL = new URL2(`${this.origin}${originalUrl}`);
        } catch (err) {
          this.memoizedURL = Object.create(null);
        }
      }
      return this.memoizedURL;
    },
    get fresh() {
      const method = this.method;
      const s = this.ctx.status;
      if (method !== "GET" && method !== "HEAD")
        return false;
      if (s >= 200 && s < 300 || s === 304) {
        return fresh(this.header, this.response.header);
      }
      return false;
    },
    get stale() {
      return !this.fresh;
    },
    get idempotent() {
      const methods = ["GET", "HEAD", "PUT", "DELETE", "OPTIONS", "TRACE"];
      return !!~methods.indexOf(this.method);
    },
    get socket() {
      return this.req.socket;
    },
    get charset() {
      try {
        const { parameters } = contentType.parse(this.req);
        return parameters.charset || "";
      } catch (e) {
        return "";
      }
    },
    get length() {
      const len = this.get("Content-Length");
      if (len === "")
        return;
      return ~~len;
    },
    get protocol() {
      if (this.socket.encrypted)
        return "https";
      if (!this.app.proxy)
        return "http";
      const proto = this.get("X-Forwarded-Proto");
      return proto ? splitCommaSeparatedValues(proto, 1)[0] : "http";
    },
    get secure() {
      return this.protocol === "https";
    },
    get ips() {
      const proxy = this.app.proxy;
      const val = this.get(this.app.proxyIpHeader);
      let ips = proxy && val ? splitCommaSeparatedValues(val) : [];
      if (this.app.maxIpsCount > 0) {
        ips = ips.slice(-this.app.maxIpsCount);
      }
      return ips;
    },
    get ip() {
      if (!this[IP]) {
        this[IP] = this.ips[0] || this.socket.remoteAddress || "";
      }
      return this[IP];
    },
    set ip(_ip) {
      this[IP] = _ip;
    },
    get subdomains() {
      const offset = this.app.subdomainOffset;
      const hostname = this.hostname;
      if (net.isIP(hostname))
        return [];
      return hostname.split(".").reverse().slice(offset);
    },
    get accept() {
      return this._accept || (this._accept = accepts(this.req));
    },
    set accept(obj) {
      this._accept = obj;
    },
    accepts(...args2) {
      return this.accept.types(...args2);
    },
    acceptsEncodings(...args2) {
      return this.accept.encodings(...args2);
    },
    acceptsCharsets(...args2) {
      return this.accept.charsets(...args2);
    },
    acceptsLanguages(...args2) {
      return this.accept.languages(...args2);
    },
    is(type, ...types) {
      return typeis(this.req, type, ...types);
    },
    get type() {
      const type = this.get("Content-Type");
      if (!type)
        return "";
      return type.split(";")[0];
    },
    get(field) {
      const req = this.req;
      switch (field = field.toLowerCase()) {
        case "referer":
        case "referrer":
          return req.headers.referrer || req.headers.referer || "";
        default:
          return req.headers[field] || "";
      }
    },
    inspect() {
      if (!this.req)
        return;
      return this.toJSON();
    },
    toJSON() {
      return only(this, [
        "method",
        "url",
        "header"
      ]);
    }
  };
  if (util.inspect.custom) {
    module2.exports[util.inspect.custom] = module2.exports.inspect;
  }
  function splitCommaSeparatedValues(value, limit) {
    return value.split(",", limit).map((v) => v.trim());
  }
});

// node_modules/.bun/co@4.6.0/node_modules/co/index.js
var require_co = __commonJS((exports2, module2) => {
  var slice = Array.prototype.slice;
  module2.exports = co["default"] = co.co = co;
  co.wrap = function(fn2) {
    createPromise.__generatorFunction__ = fn2;
    return createPromise;
    function createPromise() {
      return co.call(this, fn2.apply(this, arguments));
    }
  };
  function co(gen) {
    var ctx = this;
    var args2 = slice.call(arguments, 1);
    return new Promise(function(resolve, reject) {
      if (typeof gen === "function")
        gen = gen.apply(ctx, args2);
      if (!gen || typeof gen.next !== "function")
        return resolve(gen);
      onFulfilled();
      function onFulfilled(res) {
        var ret;
        try {
          ret = gen.next(res);
        } catch (e) {
          return reject(e);
        }
        next(ret);
      }
      function onRejected(err) {
        var ret;
        try {
          ret = gen.throw(err);
        } catch (e) {
          return reject(e);
        }
        next(ret);
      }
      function next(ret) {
        if (ret.done)
          return resolve(ret.value);
        var value = toPromise.call(ctx, ret.value);
        if (value && isPromise(value))
          return value.then(onFulfilled, onRejected);
        return onRejected(new TypeError("You may only yield a function, promise, generator, array, or object, " + 'but the following object was passed: "' + String(ret.value) + '"'));
      }
    });
  }
  function toPromise(obj) {
    if (!obj)
      return obj;
    if (isPromise(obj))
      return obj;
    if (isGeneratorFunction(obj) || isGenerator(obj))
      return co.call(this, obj);
    if (typeof obj == "function")
      return thunkToPromise.call(this, obj);
    if (Array.isArray(obj))
      return arrayToPromise.call(this, obj);
    if (isObject(obj))
      return objectToPromise.call(this, obj);
    return obj;
  }
  function thunkToPromise(fn2) {
    var ctx = this;
    return new Promise(function(resolve, reject) {
      fn2.call(ctx, function(err, res) {
        if (err)
          return reject(err);
        if (arguments.length > 2)
          res = slice.call(arguments, 1);
        resolve(res);
      });
    });
  }
  function arrayToPromise(obj) {
    return Promise.all(obj.map(toPromise, this));
  }
  function objectToPromise(obj) {
    var results = new obj.constructor;
    var keys = Object.keys(obj);
    var promises = [];
    for (var i = 0;i < keys.length; i++) {
      var key = keys[i];
      var promise = toPromise.call(this, obj[key]);
      if (promise && isPromise(promise))
        defer(promise, key);
      else
        results[key] = obj[key];
    }
    return Promise.all(promises).then(function() {
      return results;
    });
    function defer(promise2, key2) {
      results[key2] = undefined;
      promises.push(promise2.then(function(res) {
        results[key2] = res;
      }));
    }
  }
  function isPromise(obj) {
    return typeof obj.then == "function";
  }
  function isGenerator(obj) {
    return typeof obj.next == "function" && typeof obj.throw == "function";
  }
  function isGeneratorFunction(obj) {
    var constructor = obj.constructor;
    if (!constructor)
      return false;
    if (constructor.name === "GeneratorFunction" || constructor.displayName === "GeneratorFunction")
      return true;
    return isGenerator(constructor.prototype);
  }
  function isObject(val) {
    return Object == val.constructor;
  }
});

// node_modules/.bun/koa-convert@2.0.0/node_modules/koa-convert/index.js
var require_koa_convert = __commonJS((exports2, module2) => {
  var co = require_co();
  var compose = require_koa_compose();
  module2.exports = convert;
  function convert(mw) {
    if (typeof mw !== "function") {
      throw new TypeError("middleware must be a function");
    }
    if (mw.constructor.name !== "GeneratorFunction" && mw.constructor.name !== "AsyncGeneratorFunction") {
      return mw;
    }
    const converted = function(ctx, next) {
      return co.call(ctx, mw.call(ctx, function* (next2) {
        return yield next2();
      }(next)));
    };
    converted._name = mw._name || mw.name;
    return converted;
  }
  convert.compose = function(arr) {
    if (!Array.isArray(arr)) {
      arr = Array.from(arguments);
    }
    return compose(arr.map(convert));
  };
  convert.back = function(mw) {
    if (typeof mw !== "function") {
      throw new TypeError("middleware must be a function");
    }
    if (mw.constructor.name === "GeneratorFunction" || mw.constructor.name === "AsyncGeneratorFunction") {
      return mw;
    }
    const converted = function* (next) {
      const ctx = this;
      let called = false;
      yield mw(ctx, function() {
        if (called) {
          throw new Error("next() called multiple times");
        }
        called = true;
        return co.call(ctx, next);
      });
    };
    converted._name = mw._name || mw.name;
    return converted;
  };
});

// node_modules/.bun/koa@2.16.4/node_modules/koa/lib/application.js
var require_application = __commonJS((exports2, module2) => {
  var isGeneratorFunction = require_is_generator_function();
  var debug = require_src()("koa:application");
  var onFinished = require_on_finished();
  var assert = require("assert");
  var response = require_response();
  var compose = require_koa_compose();
  var context = require_context();
  var request = require_request();
  var statuses = require_statuses();
  var Emitter = require("events");
  var util = require("util");
  var Stream = require("stream");
  var http = require("http");
  var only = require_only();
  var convert = require_koa_convert();
  var deprecate2 = require_depd2()("koa");
  var { HttpError } = require_http_errors();
  module2.exports = class Application extends Emitter {
    constructor(options) {
      super();
      options = options || {};
      this.proxy = options.proxy || false;
      this.subdomainOffset = options.subdomainOffset || 2;
      this.proxyIpHeader = options.proxyIpHeader || "X-Forwarded-For";
      this.maxIpsCount = options.maxIpsCount || 0;
      this.env = options.env || "development";
      if (options.keys)
        this.keys = options.keys;
      this.middleware = [];
      this.context = Object.create(context);
      this.request = Object.create(request);
      this.response = Object.create(response);
      if (util.inspect.custom) {
        this[util.inspect.custom] = this.inspect;
      }
      if (options.asyncLocalStorage) {
        const { AsyncLocalStorage } = require("async_hooks");
        assert(AsyncLocalStorage, "Requires node 12.17.0 or higher to enable asyncLocalStorage");
        this.ctxStorage = new AsyncLocalStorage;
      }
    }
    listen(...args2) {
      debug("listen");
      const server = http.createServer(this.callback());
      return server.listen(...args2);
    }
    toJSON() {
      return only(this, [
        "subdomainOffset",
        "proxy",
        "env"
      ]);
    }
    inspect() {
      return this.toJSON();
    }
    use(fn2) {
      if (typeof fn2 !== "function")
        throw new TypeError("middleware must be a function!");
      if (isGeneratorFunction(fn2)) {
        deprecate2("Support for generators will be removed in v3. " + "See the documentation for examples of how to convert old middleware " + "https://github.com/koajs/koa/blob/master/docs/migration.md");
        fn2 = convert(fn2);
      }
      debug("use %s", fn2._name || fn2.name || "-");
      this.middleware.push(fn2);
      return this;
    }
    callback() {
      const fn2 = compose(this.middleware);
      if (!this.listenerCount("error"))
        this.on("error", this.onerror);
      const handleRequest = (req, res) => {
        const ctx = this.createContext(req, res);
        if (!this.ctxStorage) {
          return this.handleRequest(ctx, fn2);
        }
        return this.ctxStorage.run(ctx, async () => {
          return await this.handleRequest(ctx, fn2);
        });
      };
      return handleRequest;
    }
    get currentContext() {
      if (this.ctxStorage)
        return this.ctxStorage.getStore();
    }
    handleRequest(ctx, fnMiddleware) {
      const res = ctx.res;
      res.statusCode = 404;
      const onerror = (err) => ctx.onerror(err);
      const handleResponse = () => respond(ctx);
      onFinished(res, onerror);
      return fnMiddleware(ctx).then(handleResponse).catch(onerror);
    }
    createContext(req, res) {
      const context2 = Object.create(this.context);
      const request2 = context2.request = Object.create(this.request);
      const response2 = context2.response = Object.create(this.response);
      context2.app = request2.app = response2.app = this;
      context2.req = request2.req = response2.req = req;
      context2.res = request2.res = response2.res = res;
      request2.ctx = response2.ctx = context2;
      request2.response = response2;
      response2.request = request2;
      context2.originalUrl = request2.originalUrl = req.url;
      context2.state = {};
      return context2;
    }
    onerror(err) {
      const isNativeError = Object.prototype.toString.call(err) === "[object Error]" || err instanceof Error;
      if (!isNativeError)
        throw new TypeError(util.format("non-error thrown: %j", err));
      if (err.status === 404 || err.expose)
        return;
      if (this.silent)
        return;
      const msg = err.stack || err.toString();
      console.error(`
${msg.replace(/^/gm, "  ")}
`);
    }
    static get default() {
      return Application;
    }
    createAsyncCtxStorageMiddleware() {
      const app = this;
      return async function asyncCtxStorage(ctx, next) {
        await app.ctxStorage.run(ctx, async () => {
          return await next();
        });
      };
    }
  };
  function respond(ctx) {
    if (ctx.respond === false)
      return;
    if (!ctx.writable)
      return;
    const res = ctx.res;
    let body = ctx.body;
    const code = ctx.status;
    if (statuses.empty[code]) {
      ctx.body = null;
      return res.end();
    }
    if (ctx.method === "HEAD") {
      if (!res.headersSent && !ctx.response.has("Content-Length")) {
        const { length } = ctx.response;
        if (Number.isInteger(length))
          ctx.length = length;
      }
      return res.end();
    }
    if (body == null) {
      if (ctx.response._explicitNullBody) {
        ctx.response.remove("Content-Type");
        ctx.response.remove("Transfer-Encoding");
        return res.end();
      }
      if (ctx.req.httpVersionMajor >= 2) {
        body = String(code);
      } else {
        body = ctx.message || String(code);
      }
      if (!res.headersSent) {
        ctx.type = "text";
        ctx.length = Buffer.byteLength(body);
      }
      return res.end(body);
    }
    if (Buffer.isBuffer(body))
      return res.end(body);
    if (typeof body === "string")
      return res.end(body);
    if (body instanceof Stream)
      return body.pipe(res);
    body = JSON.stringify(body);
    if (!res.headersSent) {
      ctx.length = Buffer.byteLength(body);
    }
    res.end(body);
  }
  module2.exports.HttpError = HttpError;
});

// node_modules/.bun/statuses@2.0.2/node_modules/statuses/codes.json
var require_codes2 = __commonJS((exports2, module2) => {
  module2.exports = {
    "100": "Continue",
    "101": "Switching Protocols",
    "102": "Processing",
    "103": "Early Hints",
    "200": "OK",
    "201": "Created",
    "202": "Accepted",
    "203": "Non-Authoritative Information",
    "204": "No Content",
    "205": "Reset Content",
    "206": "Partial Content",
    "207": "Multi-Status",
    "208": "Already Reported",
    "226": "IM Used",
    "300": "Multiple Choices",
    "301": "Moved Permanently",
    "302": "Found",
    "303": "See Other",
    "304": "Not Modified",
    "305": "Use Proxy",
    "307": "Temporary Redirect",
    "308": "Permanent Redirect",
    "400": "Bad Request",
    "401": "Unauthorized",
    "402": "Payment Required",
    "403": "Forbidden",
    "404": "Not Found",
    "405": "Method Not Allowed",
    "406": "Not Acceptable",
    "407": "Proxy Authentication Required",
    "408": "Request Timeout",
    "409": "Conflict",
    "410": "Gone",
    "411": "Length Required",
    "412": "Precondition Failed",
    "413": "Payload Too Large",
    "414": "URI Too Long",
    "415": "Unsupported Media Type",
    "416": "Range Not Satisfiable",
    "417": "Expectation Failed",
    "418": "I'm a Teapot",
    "421": "Misdirected Request",
    "422": "Unprocessable Entity",
    "423": "Locked",
    "424": "Failed Dependency",
    "425": "Too Early",
    "426": "Upgrade Required",
    "428": "Precondition Required",
    "429": "Too Many Requests",
    "431": "Request Header Fields Too Large",
    "451": "Unavailable For Legal Reasons",
    "500": "Internal Server Error",
    "501": "Not Implemented",
    "502": "Bad Gateway",
    "503": "Service Unavailable",
    "504": "Gateway Timeout",
    "505": "HTTP Version Not Supported",
    "506": "Variant Also Negotiates",
    "507": "Insufficient Storage",
    "508": "Loop Detected",
    "509": "Bandwidth Limit Exceeded",
    "510": "Not Extended",
    "511": "Network Authentication Required"
  };
});

// node_modules/.bun/statuses@2.0.2/node_modules/statuses/index.js
var require_statuses2 = __commonJS((exports2, module2) => {
  /*!
   * statuses
   * Copyright(c) 2014 Jonathan Ong
   * Copyright(c) 2016 Douglas Christopher Wilson
   * MIT Licensed
   */
  var codes = require_codes2();
  module2.exports = status;
  status.message = codes;
  status.code = createMessageToStatusCodeMap(codes);
  status.codes = createStatusCodeList(codes);
  status.redirect = {
    300: true,
    301: true,
    302: true,
    303: true,
    305: true,
    307: true,
    308: true
  };
  status.empty = {
    204: true,
    205: true,
    304: true
  };
  status.retry = {
    502: true,
    503: true,
    504: true
  };
  function createMessageToStatusCodeMap(codes2) {
    var map = {};
    Object.keys(codes2).forEach(function forEachCode(code) {
      var message2 = codes2[code];
      var status2 = Number(code);
      map[message2.toLowerCase()] = status2;
    });
    return map;
  }
  function createStatusCodeList(codes2) {
    return Object.keys(codes2).map(function mapCode(code) {
      return Number(code);
    });
  }
  function getStatusCode(message2) {
    var msg = message2.toLowerCase();
    if (!Object.prototype.hasOwnProperty.call(status.code, msg)) {
      throw new Error('invalid status message: "' + message2 + '"');
    }
    return status.code[msg];
  }
  function getStatusMessage(code) {
    if (!Object.prototype.hasOwnProperty.call(status.message, code)) {
      throw new Error("invalid status code: " + code);
    }
    return status.message[code];
  }
  function status(code) {
    if (typeof code === "number") {
      return getStatusMessage(code);
    }
    if (typeof code !== "string") {
      throw new TypeError("code must be a number or string");
    }
    var n = parseInt(code, 10);
    if (!isNaN(n)) {
      return getStatusMessage(n);
    }
    return getStatusCode(code);
  }
});

// node_modules/.bun/http-errors@2.0.1/node_modules/http-errors/index.js
var require_http_errors2 = __commonJS((exports2, module2) => {
  /*!
   * http-errors
   * Copyright(c) 2014 Jonathan Ong
   * Copyright(c) 2016 Douglas Christopher Wilson
   * MIT Licensed
   */
  var deprecate2 = require_depd2()("http-errors");
  var setPrototypeOf = require_setprototypeof();
  var statuses = require_statuses2();
  var inherits = require_inherits();
  var toIdentifier = require_toidentifier();
  module2.exports = createError;
  module2.exports.HttpError = createHttpErrorConstructor();
  module2.exports.isHttpError = createIsHttpErrorFunction(module2.exports.HttpError);
  populateConstructorExports(module2.exports, statuses.codes, module2.exports.HttpError);
  function codeClass(status) {
    return Number(String(status).charAt(0) + "00");
  }
  function createError() {
    var err;
    var msg;
    var status = 500;
    var props = {};
    for (var i = 0;i < arguments.length; i++) {
      var arg = arguments[i];
      var type = typeof arg;
      if (type === "object" && arg instanceof Error) {
        err = arg;
        status = err.status || err.statusCode || status;
      } else if (type === "number" && i === 0) {
        status = arg;
      } else if (type === "string") {
        msg = arg;
      } else if (type === "object") {
        props = arg;
      } else {
        throw new TypeError("argument #" + (i + 1) + " unsupported type " + type);
      }
    }
    if (typeof status === "number" && (status < 400 || status >= 600)) {
      deprecate2("non-error status code; use only 4xx or 5xx status codes");
    }
    if (typeof status !== "number" || !statuses.message[status] && (status < 400 || status >= 600)) {
      status = 500;
    }
    var HttpError2 = createError[status] || createError[codeClass(status)];
    if (!err) {
      err = HttpError2 ? new HttpError2(msg) : new Error(msg || statuses.message[status]);
      Error.captureStackTrace(err, createError);
    }
    if (!HttpError2 || !(err instanceof HttpError2) || err.status !== status) {
      err.expose = status < 500;
      err.status = err.statusCode = status;
    }
    for (var key in props) {
      if (key !== "status" && key !== "statusCode") {
        err[key] = props[key];
      }
    }
    return err;
  }
  function createHttpErrorConstructor() {
    function HttpError2() {
      throw new TypeError("cannot construct abstract class");
    }
    inherits(HttpError2, Error);
    return HttpError2;
  }
  function createClientErrorConstructor(HttpError2, name, code) {
    var className = toClassName(name);
    function ClientError(message2) {
      var msg = message2 != null ? message2 : statuses.message[code];
      var err = new Error(msg);
      Error.captureStackTrace(err, ClientError);
      setPrototypeOf(err, ClientError.prototype);
      Object.defineProperty(err, "message", {
        enumerable: true,
        configurable: true,
        value: msg,
        writable: true
      });
      Object.defineProperty(err, "name", {
        enumerable: false,
        configurable: true,
        value: className,
        writable: true
      });
      return err;
    }
    inherits(ClientError, HttpError2);
    nameFunc(ClientError, className);
    ClientError.prototype.status = code;
    ClientError.prototype.statusCode = code;
    ClientError.prototype.expose = true;
    return ClientError;
  }
  function createIsHttpErrorFunction(HttpError2) {
    return function isHttpError(val) {
      if (!val || typeof val !== "object") {
        return false;
      }
      if (val instanceof HttpError2) {
        return true;
      }
      return val instanceof Error && typeof val.expose === "boolean" && typeof val.statusCode === "number" && val.status === val.statusCode;
    };
  }
  function createServerErrorConstructor(HttpError2, name, code) {
    var className = toClassName(name);
    function ServerError(message2) {
      var msg = message2 != null ? message2 : statuses.message[code];
      var err = new Error(msg);
      Error.captureStackTrace(err, ServerError);
      setPrototypeOf(err, ServerError.prototype);
      Object.defineProperty(err, "message", {
        enumerable: true,
        configurable: true,
        value: msg,
        writable: true
      });
      Object.defineProperty(err, "name", {
        enumerable: false,
        configurable: true,
        value: className,
        writable: true
      });
      return err;
    }
    inherits(ServerError, HttpError2);
    nameFunc(ServerError, className);
    ServerError.prototype.status = code;
    ServerError.prototype.statusCode = code;
    ServerError.prototype.expose = false;
    return ServerError;
  }
  function nameFunc(func, name) {
    var desc = Object.getOwnPropertyDescriptor(func, "name");
    if (desc && desc.configurable) {
      desc.value = name;
      Object.defineProperty(func, "name", desc);
    }
  }
  function populateConstructorExports(exports3, codes, HttpError2) {
    codes.forEach(function forEachCode(code) {
      var CodeError;
      var name = toIdentifier(statuses.message[code]);
      switch (codeClass(code)) {
        case 400:
          CodeError = createClientErrorConstructor(HttpError2, name, code);
          break;
        case 500:
          CodeError = createServerErrorConstructor(HttpError2, name, code);
          break;
      }
      if (CodeError) {
        exports3[code] = CodeError;
        exports3[name] = CodeError;
      }
    });
  }
  function toClassName(name) {
    return name.slice(-5) === "Error" ? name : name + "Error";
  }
});

// node_modules/.bun/path-to-regexp@8.3.0/node_modules/path-to-regexp/dist/index.js
var require_dist = __commonJS((exports2) => {
  Object.defineProperty(exports2, "__esModule", { value: true });
  exports2.PathError = exports2.TokenData = undefined;
  exports2.parse = parse;
  exports2.compile = compile;
  exports2.match = match;
  exports2.pathToRegexp = pathToRegexp;
  exports2.stringify = stringify;
  var DEFAULT_DELIMITER = "/";
  var NOOP_VALUE = (value) => value;
  var ID_START = /^[$_\p{ID_Start}]$/u;
  var ID_CONTINUE = /^[$\u200c\u200d\p{ID_Continue}]$/u;
  var SIMPLE_TOKENS = {
    "{": "{",
    "}": "}",
    "(": "(",
    ")": ")",
    "[": "[",
    "]": "]",
    "+": "+",
    "?": "?",
    "!": "!"
  };
  function escapeText(str) {
    return str.replace(/[{}()\[\]+?!:*\\]/g, "\\$&");
  }
  function escape(str) {
    return str.replace(/[.+*?^${}()[\]|/\\]/g, "\\$&");
  }

  class TokenData {
    constructor(tokens, originalPath) {
      this.tokens = tokens;
      this.originalPath = originalPath;
    }
  }
  exports2.TokenData = TokenData;

  class PathError extends TypeError {
    constructor(message2, originalPath) {
      let text = message2;
      if (originalPath)
        text += `: ${originalPath}`;
      text += `; visit https://git.new/pathToRegexpError for info`;
      super(text);
      this.originalPath = originalPath;
    }
  }
  exports2.PathError = PathError;
  function parse(str, options = {}) {
    const { encodePath = NOOP_VALUE } = options;
    const chars = [...str];
    const tokens = [];
    let index = 0;
    let pos = 0;
    function name() {
      let value = "";
      if (ID_START.test(chars[index])) {
        do {
          value += chars[index++];
        } while (ID_CONTINUE.test(chars[index]));
      } else if (chars[index] === '"') {
        let quoteStart = index;
        while (index++ < chars.length) {
          if (chars[index] === '"') {
            index++;
            quoteStart = 0;
            break;
          }
          if (chars[index] === "\\")
            index++;
          value += chars[index];
        }
        if (quoteStart) {
          throw new PathError(`Unterminated quote at index ${quoteStart}`, str);
        }
      }
      if (!value) {
        throw new PathError(`Missing parameter name at index ${index}`, str);
      }
      return value;
    }
    while (index < chars.length) {
      const value = chars[index];
      const type = SIMPLE_TOKENS[value];
      if (type) {
        tokens.push({ type, index: index++, value });
      } else if (value === "\\") {
        tokens.push({ type: "escape", index: index++, value: chars[index++] });
      } else if (value === ":") {
        tokens.push({ type: "param", index: index++, value: name() });
      } else if (value === "*") {
        tokens.push({ type: "wildcard", index: index++, value: name() });
      } else {
        tokens.push({ type: "char", index: index++, value });
      }
    }
    tokens.push({ type: "end", index, value: "" });
    function consumeUntil(endType) {
      const output = [];
      while (true) {
        const token = tokens[pos++];
        if (token.type === endType)
          break;
        if (token.type === "char" || token.type === "escape") {
          let path = token.value;
          let cur = tokens[pos];
          while (cur.type === "char" || cur.type === "escape") {
            path += cur.value;
            cur = tokens[++pos];
          }
          output.push({
            type: "text",
            value: encodePath(path)
          });
          continue;
        }
        if (token.type === "param" || token.type === "wildcard") {
          output.push({
            type: token.type,
            name: token.value
          });
          continue;
        }
        if (token.type === "{") {
          output.push({
            type: "group",
            tokens: consumeUntil("}")
          });
          continue;
        }
        throw new PathError(`Unexpected ${token.type} at index ${token.index}, expected ${endType}`, str);
      }
      return output;
    }
    return new TokenData(consumeUntil("end"), str);
  }
  function compile(path, options = {}) {
    const { encode = encodeURIComponent, delimiter = DEFAULT_DELIMITER } = options;
    const data = typeof path === "object" ? path : parse(path, options);
    const fn2 = tokensToFunction(data.tokens, delimiter, encode);
    return function path2(params = {}) {
      const [path3, ...missing] = fn2(params);
      if (missing.length) {
        throw new TypeError(`Missing parameters: ${missing.join(", ")}`);
      }
      return path3;
    };
  }
  function tokensToFunction(tokens, delimiter, encode) {
    const encoders = tokens.map((token) => tokenToFunction(token, delimiter, encode));
    return (data) => {
      const result = [""];
      for (const encoder of encoders) {
        const [value, ...extras] = encoder(data);
        result[0] += value;
        result.push(...extras);
      }
      return result;
    };
  }
  function tokenToFunction(token, delimiter, encode) {
    if (token.type === "text")
      return () => [token.value];
    if (token.type === "group") {
      const fn2 = tokensToFunction(token.tokens, delimiter, encode);
      return (data) => {
        const [value, ...missing] = fn2(data);
        if (!missing.length)
          return [value];
        return [""];
      };
    }
    const encodeValue = encode || NOOP_VALUE;
    if (token.type === "wildcard" && encode !== false) {
      return (data) => {
        const value = data[token.name];
        if (value == null)
          return ["", token.name];
        if (!Array.isArray(value) || value.length === 0) {
          throw new TypeError(`Expected "${token.name}" to be a non-empty array`);
        }
        return [
          value.map((value2, index) => {
            if (typeof value2 !== "string") {
              throw new TypeError(`Expected "${token.name}/${index}" to be a string`);
            }
            return encodeValue(value2);
          }).join(delimiter)
        ];
      };
    }
    return (data) => {
      const value = data[token.name];
      if (value == null)
        return ["", token.name];
      if (typeof value !== "string") {
        throw new TypeError(`Expected "${token.name}" to be a string`);
      }
      return [encodeValue(value)];
    };
  }
  function match(path, options = {}) {
    const { decode = decodeURIComponent, delimiter = DEFAULT_DELIMITER } = options;
    const { regexp, keys } = pathToRegexp(path, options);
    const decoders = keys.map((key) => {
      if (decode === false)
        return NOOP_VALUE;
      if (key.type === "param")
        return decode;
      return (value) => value.split(delimiter).map(decode);
    });
    return function match2(input) {
      const m = regexp.exec(input);
      if (!m)
        return false;
      const path2 = m[0];
      const params = Object.create(null);
      for (let i = 1;i < m.length; i++) {
        if (m[i] === undefined)
          continue;
        const key = keys[i - 1];
        const decoder = decoders[i - 1];
        params[key.name] = decoder(m[i]);
      }
      return { path: path2, params };
    };
  }
  function pathToRegexp(path, options = {}) {
    const { delimiter = DEFAULT_DELIMITER, end = true, sensitive = false, trailing = true } = options;
    const keys = [];
    const flags = sensitive ? "" : "i";
    const sources = [];
    for (const input of pathsToArray(path, [])) {
      const data = typeof input === "object" ? input : parse(input, options);
      for (const tokens of flatten(data.tokens, 0, [])) {
        sources.push(toRegExpSource(tokens, delimiter, keys, data.originalPath));
      }
    }
    let pattern = `^(?:${sources.join("|")})`;
    if (trailing)
      pattern += `(?:${escape(delimiter)}$)?`;
    pattern += end ? "$" : `(?=${escape(delimiter)}|$)`;
    const regexp = new RegExp(pattern, flags);
    return { regexp, keys };
  }
  function pathsToArray(paths, init) {
    if (Array.isArray(paths)) {
      for (const p of paths)
        pathsToArray(p, init);
    } else {
      init.push(paths);
    }
    return init;
  }
  function* flatten(tokens, index, init) {
    if (index === tokens.length) {
      return yield init;
    }
    const token = tokens[index];
    if (token.type === "group") {
      for (const seq of flatten(token.tokens, 0, init.slice())) {
        yield* flatten(tokens, index + 1, seq);
      }
    } else {
      init.push(token);
    }
    yield* flatten(tokens, index + 1, init);
  }
  function toRegExpSource(tokens, delimiter, keys, originalPath) {
    let result = "";
    let backtrack = "";
    let isSafeSegmentParam = true;
    for (const token of tokens) {
      if (token.type === "text") {
        result += escape(token.value);
        backtrack += token.value;
        isSafeSegmentParam || (isSafeSegmentParam = token.value.includes(delimiter));
        continue;
      }
      if (token.type === "param" || token.type === "wildcard") {
        if (!isSafeSegmentParam && !backtrack) {
          throw new PathError(`Missing text before "${token.name}" ${token.type}`, originalPath);
        }
        if (token.type === "param") {
          result += `(${negate(delimiter, isSafeSegmentParam ? "" : backtrack)}+)`;
        } else {
          result += `([\\s\\S]+)`;
        }
        keys.push(token);
        backtrack = "";
        isSafeSegmentParam = false;
        continue;
      }
    }
    return result;
  }
  function negate(delimiter, backtrack) {
    if (backtrack.length < 2) {
      if (delimiter.length < 2)
        return `[^${escape(delimiter + backtrack)}]`;
      return `(?:(?!${escape(delimiter)})[^${escape(backtrack)}])`;
    }
    if (delimiter.length < 2) {
      return `(?:(?!${escape(backtrack)})[^${escape(delimiter)}])`;
    }
    return `(?:(?!${escape(backtrack)}|${escape(delimiter)})[\\s\\S])`;
  }
  function stringifyTokens(tokens) {
    let value = "";
    let i = 0;
    function name(value2) {
      const isSafe = isNameSafe(value2) && isNextNameSafe(tokens[i]);
      return isSafe ? value2 : JSON.stringify(value2);
    }
    while (i < tokens.length) {
      const token = tokens[i++];
      if (token.type === "text") {
        value += escapeText(token.value);
        continue;
      }
      if (token.type === "group") {
        value += `{${stringifyTokens(token.tokens)}}`;
        continue;
      }
      if (token.type === "param") {
        value += `:${name(token.name)}`;
        continue;
      }
      if (token.type === "wildcard") {
        value += `*${name(token.name)}`;
        continue;
      }
      throw new TypeError(`Unknown token type: ${token.type}`);
    }
    return value;
  }
  function stringify(data) {
    return stringifyTokens(data.tokens);
  }
  function isNameSafe(name) {
    const [first, ...rest] = name;
    return ID_START.test(first) && rest.every((char) => ID_CONTINUE.test(char));
  }
  function isNextNameSafe(token) {
    if (token && token.type === "text")
      return !ID_CONTINUE.test(token.value[0]);
    return true;
  }
});

// node_modules/.bun/koa-router@14.0.0/node_modules/koa-router/lib/layer.js
var require_layer = __commonJS((exports2, module2) => {
  var { parse: parseUrl, format: formatUrl } = require("node:url");
  var { pathToRegexp, compile, parse } = require_dist();
  module2.exports = class Layer {
    constructor(path, methods, middleware, opts = {}) {
      this.opts = opts;
      this.name = this.opts.name || null;
      this.methods = [];
      for (const method of methods) {
        const l = this.methods.push(method.toUpperCase());
        if (this.methods[l - 1] === "GET")
          this.methods.unshift("HEAD");
      }
      this.stack = Array.isArray(middleware) ? middleware : [middleware];
      for (let i = 0;i < this.stack.length; i++) {
        const fn2 = this.stack[i];
        const type = typeof fn2;
        if (type !== "function")
          throw new Error(`${methods.toString()} \`${this.opts.name || path}\`: \`middleware\` must be a function, not \`${type}\``);
      }
      this.path = path;
      this.paramNames = [];
      if (this.opts.pathAsRegExp === true) {
        this.regexp = new RegExp(path);
      } else if (this.path) {
        if ("strict" in this.opts) {
          this.opts.trailing = this.opts.strict !== true;
        }
        const { regexp, keys } = pathToRegexp(this.path, this.opts);
        this.regexp = regexp;
        this.paramNames = keys;
      }
    }
    match(path) {
      return this.regexp.test(path);
    }
    params(path, captures, params = {}) {
      for (let len = captures.length, i = 0;i < len; i++) {
        if (this.paramNames[i]) {
          const c = captures[i];
          if (c && c.length > 0)
            params[this.paramNames[i].name] = c ? safeDecodeURIComponent(c) : c;
        }
      }
      return params;
    }
    captures(path) {
      return this.opts.ignoreCaptures ? [] : path.match(this.regexp).slice(1);
    }
    url(params, options) {
      let args2 = params;
      const url = this.path.replace(/\(\.\*\)/g, "");
      if (typeof params !== "object") {
        args2 = Array.prototype.slice.call(arguments);
        if (typeof args2[args2.length - 1] === "object") {
          options = args2[args2.length - 1];
          args2 = args2.slice(0, -1);
        }
      }
      const toPath = compile(url, { encode: encodeURIComponent, ...options });
      let replaced;
      const { tokens } = parse(url);
      let replace = {};
      if (Array.isArray(args2)) {
        for (let len = tokens.length, i = 0, j = 0;i < len; i++) {
          if (tokens[i].name) {
            replace[tokens[i].name] = args2[j++];
          }
        }
      } else if (tokens.some((token) => token.name)) {
        replace = params;
      } else if (!options) {
        options = params;
      }
      for (const [key, value] of Object.entries(replace)) {
        replace[key] = String(value);
      }
      replaced = toPath(replace);
      if (options && options.query) {
        replaced = parseUrl(replaced);
        if (typeof options.query === "string") {
          replaced.search = options.query;
        } else {
          replaced.search = undefined;
          replaced.query = options.query;
        }
        return formatUrl(replaced);
      }
      return replaced;
    }
    param(param, fn2) {
      const { stack: stack2 } = this;
      const params = this.paramNames;
      const middleware = function(ctx, next) {
        return fn2.call(this, ctx.params[param], ctx, next);
      };
      middleware.param = param;
      const names = params.map(function(p) {
        return p.name;
      });
      const x = names.indexOf(param);
      if (x > -1) {
        stack2.some((fn3, i) => {
          if (!fn3.param || names.indexOf(fn3.param) > x) {
            stack2.splice(i, 0, middleware);
            return true;
          }
        });
      }
      return this;
    }
    setPrefix(prefix) {
      if (this.path) {
        this.path = this.path !== "/" || this.opts.strict === true ? `${prefix}${this.path}` : prefix;
        if (this.opts.pathAsRegExp === true || prefix instanceof RegExp) {
          this.regexp = new RegExp(this.path);
        } else if (this.path) {
          const { regexp, keys } = pathToRegexp(this.path, this.opts);
          this.regexp = regexp;
          this.paramNames = keys;
        }
      }
      return this;
    }
  };
  function safeDecodeURIComponent(text) {
    try {
      return decodeURIComponent(text.replace(/\+/g, " "));
    } catch {
      return text;
    }
  }
});

// node_modules/.bun/koa-router@14.0.0/node_modules/koa-router/lib/router.js
var require_router = __commonJS((exports2, module2) => {
  var http = require("node:http");
  var debug = require_src()("koa-router");
  var compose = require_koa_compose();
  var HttpError2 = require_http_errors2();
  var { pathToRegexp } = require_dist();
  var Layer = require_layer();
  var methods = http.METHODS.map((method) => method.toLowerCase());

  class Router {
    constructor(opts = {}) {
      if (!(this instanceof Router))
        return new Router(opts);
      this.opts = opts;
      this.methods = this.opts.methods || [
        "HEAD",
        "OPTIONS",
        "GET",
        "PUT",
        "PATCH",
        "POST",
        "DELETE"
      ];
      this.exclusive = Boolean(this.opts.exclusive);
      this.params = {};
      this.stack = [];
      this.host = this.opts.host;
    }
    static url(path, ...args2) {
      return Layer.prototype.url.apply({ path }, args2);
    }
    use(...middleware) {
      const router = this;
      let path;
      if (Array.isArray(middleware[0]) && typeof middleware[0][0] === "string") {
        const arrPaths = middleware[0];
        for (const p of arrPaths) {
          router.use.apply(router, [p, ...middleware.slice(1)]);
        }
        return this;
      }
      const hasPath = typeof middleware[0] === "string";
      if (hasPath)
        path = middleware.shift();
      for (const m of middleware) {
        if (m.router) {
          const cloneRouter = Object.assign(Object.create(Router.prototype), m.router, {
            stack: [...m.router.stack]
          });
          for (let j = 0;j < cloneRouter.stack.length; j++) {
            const nestedLayer = cloneRouter.stack[j];
            const cloneLayer = Object.assign(Object.create(Layer.prototype), nestedLayer);
            if (path)
              cloneLayer.setPrefix(path);
            if (router.opts.prefix)
              cloneLayer.setPrefix(router.opts.prefix);
            router.stack.push(cloneLayer);
            cloneRouter.stack[j] = cloneLayer;
          }
          if (router.params) {
            const routerParams = Object.keys(router.params);
            for (const key of routerParams) {
              cloneRouter.param(key, router.params[key]);
            }
          }
        } else {
          const { keys } = pathToRegexp(router.opts.prefix || "", router.opts);
          const routerPrefixHasParam = Boolean(router.opts.prefix && keys.length > 0);
          router.register(path || "([^/]*)", [], m, {
            end: false,
            ignoreCaptures: !hasPath && !routerPrefixHasParam,
            pathAsRegExp: true
          });
        }
      }
      return this;
    }
    prefix(prefix) {
      prefix = prefix.replace(/\/$/, "");
      this.opts.prefix = prefix;
      for (let i = 0;i < this.stack.length; i++) {
        const route = this.stack[i];
        route.setPrefix(prefix);
      }
      return this;
    }
    middleware() {
      const router = this;
      const dispatch = (ctx, next) => {
        debug("%s %s", ctx.method, ctx.path);
        const hostMatched = router.matchHost(ctx.host);
        if (!hostMatched) {
          return next();
        }
        const path = router.opts.routerPath || ctx.newRouterPath || ctx.path || ctx.routerPath;
        const matched = router.match(path, ctx.method);
        if (ctx.matched) {
          ctx.matched.push.apply(ctx.matched, matched.path);
        } else {
          ctx.matched = matched.path;
        }
        ctx.router = router;
        if (!matched.route)
          return next();
        const matchedLayers = matched.pathAndMethod;
        const mostSpecificLayer = matchedLayers[matchedLayers.length - 1];
        ctx._matchedRoute = mostSpecificLayer.path;
        if (mostSpecificLayer.name) {
          ctx._matchedRouteName = mostSpecificLayer.name;
        }
        const layerChain = (router.exclusive ? [mostSpecificLayer] : matchedLayers).reduce((memo, layer) => {
          memo.push((ctx2, next2) => {
            ctx2.captures = layer.captures(path, ctx2.captures);
            ctx2.request.params = layer.params(path, ctx2.captures, ctx2.params);
            ctx2.params = ctx2.request.params;
            ctx2.routerPath = layer.path;
            ctx2.routerName = layer.name;
            ctx2._matchedRoute = layer.path;
            if (layer.name) {
              ctx2._matchedRouteName = layer.name;
            }
            return next2();
          });
          return [...memo, ...layer.stack];
        }, []);
        return compose(layerChain)(ctx, next);
      };
      dispatch.router = this;
      return dispatch;
    }
    routes() {
      return this.middleware();
    }
    allowedMethods(options = {}) {
      const implemented = this.methods;
      return (ctx, next) => {
        return next().then(() => {
          const allowed = {};
          if (ctx.matched && (!ctx.status || ctx.status === 404)) {
            for (let i = 0;i < ctx.matched.length; i++) {
              const route = ctx.matched[i];
              for (let j = 0;j < route.methods.length; j++) {
                const method = route.methods[j];
                allowed[method] = method;
              }
            }
            const allowedArr = Object.keys(allowed);
            if (!implemented.includes(ctx.method)) {
              if (options.throw) {
                const notImplementedThrowable = typeof options.notImplemented === "function" ? options.notImplemented() : new HttpError2.NotImplemented;
                throw notImplementedThrowable;
              } else {
                ctx.status = 501;
                ctx.set("Allow", allowedArr.join(", "));
              }
            } else if (allowedArr.length > 0) {
              if (ctx.method === "OPTIONS") {
                ctx.status = 200;
                ctx.body = "";
                ctx.set("Allow", allowedArr.join(", "));
              } else if (!allowed[ctx.method]) {
                if (options.throw) {
                  const notAllowedThrowable = typeof options.methodNotAllowed === "function" ? options.methodNotAllowed() : new HttpError2.MethodNotAllowed;
                  throw notAllowedThrowable;
                } else {
                  ctx.status = 405;
                  ctx.set("Allow", allowedArr.join(", "));
                }
              }
            }
          }
        });
      };
    }
    all(name, path, middleware) {
      if (typeof path === "string" || path instanceof RegExp) {
        middleware = Array.prototype.slice.call(arguments, 2);
      } else {
        middleware = Array.prototype.slice.call(arguments, 1);
        path = name;
        name = null;
      }
      if (typeof path !== "string" && !(path instanceof RegExp) && (!Array.isArray(path) || path.length === 0))
        throw new Error("You have to provide a path when adding an all handler");
      const opts = {
        name,
        pathAsRegExp: path instanceof RegExp
      };
      this.register(path, methods, middleware, { ...this.opts, ...opts });
      return this;
    }
    redirect(source, destination, code) {
      if (typeof source === "symbol" || source[0] !== "/") {
        source = this.url(source);
        if (source instanceof Error)
          throw source;
      }
      if (typeof destination === "symbol" || destination[0] !== "/" && !destination.includes("://")) {
        destination = this.url(destination);
        if (destination instanceof Error)
          throw destination;
      }
      return this.all(source, (ctx) => {
        ctx.redirect(destination);
        ctx.status = code || 301;
      });
    }
    register(path, methods2, middleware, newOpts = {}) {
      const router = this;
      const { stack: stack2 } = this;
      const opts = { ...this.opts, ...newOpts };
      if (Array.isArray(path)) {
        for (const curPath of path) {
          router.register.call(router, curPath, methods2, middleware, opts);
        }
        return this;
      }
      const route = new Layer(path, methods2, middleware, {
        end: opts.end === false ? opts.end : true,
        name: opts.name,
        sensitive: opts.sensitive || false,
        strict: opts.strict || false,
        prefix: opts.prefix || "",
        ignoreCaptures: opts.ignoreCaptures,
        pathAsRegExp: opts.pathAsRegExp
      });
      if (this.opts.prefix) {
        route.setPrefix(this.opts.prefix);
      }
      for (let i = 0;i < Object.keys(this.params).length; i++) {
        const param = Object.keys(this.params)[i];
        route.param(param, this.params[param]);
      }
      stack2.push(route);
      debug("defined route %s %s", route.methods, route.path);
      return route;
    }
    route(name) {
      const routes = this.stack;
      for (let len = routes.length, i = 0;i < len; i++) {
        if (routes[i].name && routes[i].name === name)
          return routes[i];
      }
      return false;
    }
    url(name, ...args2) {
      const route = this.route(name);
      if (route)
        return route.url.apply(route, args2);
      return new Error(`No route found for name: ${String(name)}`);
    }
    match(path, method) {
      const layers = this.stack;
      let layer;
      const matched = {
        path: [],
        pathAndMethod: [],
        route: false
      };
      for (let len = layers.length, i = 0;i < len; i++) {
        layer = layers[i];
        debug("test %s %s", layer.path, layer.regexp);
        if (layer.match(path)) {
          matched.path.push(layer);
          if (layer.methods.length === 0 || layer.methods.includes(method)) {
            matched.pathAndMethod.push(layer);
            if (layer.methods.length > 0)
              matched.route = true;
          }
        }
      }
      return matched;
    }
    matchHost(input) {
      const { host } = this;
      if (!host) {
        return true;
      }
      if (!input) {
        return false;
      }
      if (typeof host === "string") {
        return input === host;
      }
      if (typeof host === "object" && host instanceof RegExp) {
        return host.test(input);
      }
    }
    param(param, middleware) {
      this.params[param] = middleware;
      for (let i = 0;i < this.stack.length; i++) {
        const route = this.stack[i];
        route.param(param, middleware);
      }
      return this;
    }
  }
  for (const method of methods) {
    Router.prototype[method] = function(name, path, middleware) {
      if (typeof path === "string" || path instanceof RegExp) {
        middleware = Array.prototype.slice.call(arguments, 2);
      } else {
        middleware = Array.prototype.slice.call(arguments, 1);
        path = name;
        name = null;
      }
      if (typeof path !== "string" && !(path instanceof RegExp) && (!Array.isArray(path) || path.length === 0))
        throw new Error(`You have to provide a path when adding a ${method} handler`);
      const opts = {
        name,
        pathAsRegExp: path instanceof RegExp
      };
      this.register(path, [method], middleware, { ...this.opts, ...opts });
      return this;
    };
  }
  Router.prototype.del = Router.prototype["delete"];
  module2.exports = Router;
});

// node_modules/.bun/@citizenfx+http-wrapper@0.2.2/node_modules/@citizenfx/http-wrapper/index.js
var require_http_wrapper = __commonJS((exports2, module2) => {
  var { Readable, Writable } = require("stream");
  var http = require("http");
  var objectify = (obj, [k, v]) => ({ ...obj, [k]: v });

  class IncomingMessage extends Readable {
    constructor(cfxReq, cfxRes) {
      super();
      this.headers = Object.entries(cfxReq.headers).map(([k, v]) => [k.toLowerCase(), v]).reduce(objectify, {});
      this.httpVersion = "1.1";
      this.httpVersionMajor = 1;
      this.httpVersionMinor = 1;
      this.method = cfxReq.method;
      this.rawHeaders = Object.entries(this.headers).flatMap((x) => x);
      this.rawTrailers = [];
      this.setTimeout = (ms, cb) => {
        global.setTimeout(cb, ms);
        return this;
      };
      this.trailers = {};
      this.url = cfxReq.path;
      this.aborted = false;
      try {
        let addrParts = cfxReq.address.split(":");
        if (addrParts.length != 2 || !addrParts[0].length || !addrParts[1].length) {
          throw new Error("Invalid IP:PORT");
        }
        this.connection = {
          remoteAddress: addrParts[0],
          remotePort: addrParts[1]
        };
      } catch (error) {
        console.error(`requestHandler parsing ip:port error: ${error.message}`);
        this.connection = {
          remoteAddress: "0.0.0.0",
          remotePort: 0
        };
      }
      this.socket = this.connection;
      cfxReq.setDataHandler((data) => {
        if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
          this.push(Buffer.from(data));
        } else {
          this.push(data, "utf8");
        }
        this.push(null);
      }, "binary");
    }
    _read(len) {}
    destroy(err) {}
  }

  class ServerResponse extends Writable {
    constructor(cfxReq, cfxRes) {
      super();
      this.cfxReq = cfxReq;
      this.cfxRes = cfxRes;
      this.connection = {
        remoteAddress: cfxReq.address,
        remotePort: 0,
        writable: true,
        on(...args2) {}
      };
      this.socket = this.connection;
      this.finished = false;
      this.headersSent = false;
      this.sendDate = true;
      this.statusCode = 200;
      this.statusMessage = "OK";
      this.headers = {};
    }
    addTrailers(headers) {}
    end(chunk, encoding, callback) {
      if (this.finished) {
        return;
      }
      if (typeof chunk === "function") {
        callback = chunk;
        chunk = null;
      } else if (typeof encoding === "function") {
        callback = encoding;
        encoding = null;
      }
      if (chunk) {
        this.write(chunk, encoding);
      }
      this.cfxRes.send();
      if (callback) {
        callback();
      }
      this.finished = true;
      this.cfxReq = null;
      this.cfxRes = null;
    }
    getHeader(name) {
      return this.headers[name.toLowerCase()];
    }
    getHeaderNames() {
      return Object.entries(this.headers).map(([name]) => name);
    }
    getHeaders() {
      return Object.assign({}, this.headers);
    }
    hasHeader(name) {
      return this.headers[name.toLowerCase()] !== undefined;
    }
    removeHeader(name) {
      delete this.headers[name.toLowerCase()];
    }
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    }
    setTimeout(ms, cb) {}
    _write(chunk, encoding, callback) {
      if (!this.headersSent) {
        this.writeHead(this.statusCode, this.statusMessage, this.headers);
      }
      this.cfxRes.write(chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength));
      callback();
    }
    writeContinue() {}
    writeHead(statusCode, reason, obj) {
      if (this.headersSent) {
        return;
      }
      this.headersSent = true;
      var originalStatusCode = statusCode;
      statusCode |= 0;
      if (statusCode < 100 || statusCode > 999) {
        throw new Error(`invalid status code ${originalStatusCode}`);
      }
      if (typeof reason === "string") {
        this.statusMessage = reason;
      } else {
        if (!this.statusMessage)
          this.statusMessage = http.STATUS_CODES[statusCode] || "unknown";
        obj = reason;
      }
      this.statusCode = statusCode;
      let headers;
      if (this._headers) {
        var k;
        if (obj) {
          var keys = Object.keys(obj);
          for (var i = 0;i < keys.length; i++) {
            k = keys[i];
            if (k)
              this.setHeader(k, obj[k]);
          }
        }
        if (k === undefined && this._header) {
          throw new Error(`invalid header`);
        }
        headers = this._headers;
      } else {
        headers = obj;
      }
      const headerList = {};
      for (const [key, value] of Object.entries(headers)) {
        if (Array.isArray(value)) {
          headerList[key] = value.map((a) => a.toString());
        } else {
          headerList[key] = value.toString();
        }
      }
      this.cfxRes.writeHead(this.statusCode, headerList);
    }
    _final(callback) {}
  }
  var setHttpCallback = (requestHandler) => {
    global.SetHttpHandler((req, res) => {
      requestHandler(new IncomingMessage(req, res), new ServerResponse(req, res));
    });
  };
  module2.exports.IncomingMessage = IncomingMessage;
  module2.exports.ServerResponse = ServerResponse;
  module2.exports.setHttpCallback = setHttpCallback;
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/guard/guard.mjs
function IsAsyncIterator(value) {
  return IsObject(value) && globalThis.Symbol.asyncIterator in value;
}
function IsIterator(value) {
  return IsObject(value) && globalThis.Symbol.iterator in value;
}
function IsStandardObject(value) {
  return IsObject(value) && (globalThis.Object.getPrototypeOf(value) === Object.prototype || globalThis.Object.getPrototypeOf(value) === null);
}
function IsPromise(value) {
  return value instanceof globalThis.Promise;
}
function IsDate(value) {
  return value instanceof Date && globalThis.Number.isFinite(value.getTime());
}
function IsMap(value) {
  return value instanceof globalThis.Map;
}
function IsSet(value) {
  return value instanceof globalThis.Set;
}
function IsTypedArray(value) {
  return globalThis.ArrayBuffer.isView(value);
}
function IsUint8Array(value) {
  return value instanceof globalThis.Uint8Array;
}
function HasPropertyKey(value, key) {
  return key in value;
}
function IsObject(value) {
  return value !== null && typeof value === "object";
}
function IsArray(value) {
  return globalThis.Array.isArray(value) && !globalThis.ArrayBuffer.isView(value);
}
function IsUndefined(value) {
  return value === undefined;
}
function IsNull(value) {
  return value === null;
}
function IsBoolean(value) {
  return typeof value === "boolean";
}
function IsNumber(value) {
  return typeof value === "number";
}
function IsInteger(value) {
  return globalThis.Number.isInteger(value);
}
function IsBigInt(value) {
  return typeof value === "bigint";
}
function IsString(value) {
  return typeof value === "string";
}
function IsFunction(value) {
  return typeof value === "function";
}
function IsSymbol(value) {
  return typeof value === "symbol";
}
function IsValueType(value) {
  return IsBigInt(value) || IsBoolean(value) || IsNull(value) || IsNumber(value) || IsString(value) || IsSymbol(value) || IsUndefined(value);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/guard/index.mjs
var init_guard = () => {};

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/system/policy.mjs
var TypeSystemPolicy;
var init_policy = __esm(() => {
  init_guard();
  (function(TypeSystemPolicy2) {
    TypeSystemPolicy2.InstanceMode = "default";
    TypeSystemPolicy2.ExactOptionalPropertyTypes = false;
    TypeSystemPolicy2.AllowArrayObject = false;
    TypeSystemPolicy2.AllowNaN = false;
    TypeSystemPolicy2.AllowNullVoid = false;
    function IsExactOptionalProperty(value, key) {
      return TypeSystemPolicy2.ExactOptionalPropertyTypes ? key in value : value[key] !== undefined;
    }
    TypeSystemPolicy2.IsExactOptionalProperty = IsExactOptionalProperty;
    function IsObjectLike(value) {
      const isObject = IsObject(value);
      return TypeSystemPolicy2.AllowArrayObject ? isObject : isObject && !IsArray(value);
    }
    TypeSystemPolicy2.IsObjectLike = IsObjectLike;
    function IsRecordLike(value) {
      return IsObjectLike(value) && !(value instanceof Date) && !(value instanceof Uint8Array);
    }
    TypeSystemPolicy2.IsRecordLike = IsRecordLike;
    function IsNumberLike(value) {
      return TypeSystemPolicy2.AllowNaN ? IsNumber(value) : Number.isFinite(value);
    }
    TypeSystemPolicy2.IsNumberLike = IsNumberLike;
    function IsVoidLike(value) {
      const isUndefined = IsUndefined(value);
      return TypeSystemPolicy2.AllowNullVoid ? isUndefined || value === null : isUndefined;
    }
    TypeSystemPolicy2.IsVoidLike = IsVoidLike;
  })(TypeSystemPolicy || (TypeSystemPolicy = {}));
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/registry/format.mjs
var exports_format = {};
__export(exports_format, {
  Set: () => Set2,
  Has: () => Has,
  Get: () => Get,
  Entries: () => Entries,
  Delete: () => Delete,
  Clear: () => Clear
});
function Entries() {
  return new Map(map);
}
function Clear() {
  return map.clear();
}
function Delete(format) {
  return map.delete(format);
}
function Has(format) {
  return map.has(format);
}
function Set2(format, func) {
  map.set(format, func);
}
function Get(format) {
  return map.get(format);
}
var map;
var init_format = __esm(() => {
  map = new Map;
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/registry/type.mjs
var exports_type = {};
__export(exports_type, {
  Set: () => Set3,
  Has: () => Has2,
  Get: () => Get2,
  Entries: () => Entries2,
  Delete: () => Delete2,
  Clear: () => Clear2
});
function Entries2() {
  return new Map(map2);
}
function Clear2() {
  return map2.clear();
}
function Delete2(kind) {
  return map2.delete(kind);
}
function Has2(kind) {
  return map2.has(kind);
}
function Set3(kind, func) {
  map2.set(kind, func);
}
function Get2(kind) {
  return map2.get(kind);
}
var map2;
var init_type = __esm(() => {
  map2 = new Map;
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/registry/index.mjs
var init_registry = __esm(() => {
  init_format();
  init_type();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/guard/value.mjs
var exports_value = {};
__export(exports_value, {
  IsUndefined: () => IsUndefined2,
  IsUint8Array: () => IsUint8Array2,
  IsSymbol: () => IsSymbol2,
  IsString: () => IsString2,
  IsRegExp: () => IsRegExp,
  IsObject: () => IsObject2,
  IsNumber: () => IsNumber2,
  IsNull: () => IsNull2,
  IsIterator: () => IsIterator2,
  IsFunction: () => IsFunction2,
  IsDate: () => IsDate2,
  IsBoolean: () => IsBoolean2,
  IsBigInt: () => IsBigInt2,
  IsAsyncIterator: () => IsAsyncIterator2,
  IsArray: () => IsArray2,
  HasPropertyKey: () => HasPropertyKey2
});
function HasPropertyKey2(value, key) {
  return key in value;
}
function IsAsyncIterator2(value) {
  return IsObject2(value) && !IsArray2(value) && !IsUint8Array2(value) && Symbol.asyncIterator in value;
}
function IsArray2(value) {
  return Array.isArray(value);
}
function IsBigInt2(value) {
  return typeof value === "bigint";
}
function IsBoolean2(value) {
  return typeof value === "boolean";
}
function IsDate2(value) {
  return value instanceof globalThis.Date;
}
function IsFunction2(value) {
  return typeof value === "function";
}
function IsIterator2(value) {
  return IsObject2(value) && !IsArray2(value) && !IsUint8Array2(value) && Symbol.iterator in value;
}
function IsNull2(value) {
  return value === null;
}
function IsNumber2(value) {
  return typeof value === "number";
}
function IsObject2(value) {
  return typeof value === "object" && value !== null;
}
function IsRegExp(value) {
  return value instanceof globalThis.RegExp;
}
function IsString2(value) {
  return typeof value === "string";
}
function IsSymbol2(value) {
  return typeof value === "symbol";
}
function IsUint8Array2(value) {
  return value instanceof globalThis.Uint8Array;
}
function IsUndefined2(value) {
  return value === undefined;
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/create/immutable.mjs
function ImmutableArray(value) {
  return globalThis.Object.freeze(value).map((value2) => Immutable(value2));
}
function ImmutableDate(value) {
  return value;
}
function ImmutableUint8Array(value) {
  return value;
}
function ImmutableRegExp(value) {
  return value;
}
function ImmutableObject(value) {
  const result = {};
  for (const key of Object.getOwnPropertyNames(value)) {
    result[key] = Immutable(value[key]);
  }
  for (const key of Object.getOwnPropertySymbols(value)) {
    result[key] = Immutable(value[key]);
  }
  return globalThis.Object.freeze(result);
}
function Immutable(value) {
  return IsArray2(value) ? ImmutableArray(value) : IsDate2(value) ? ImmutableDate(value) : IsUint8Array2(value) ? ImmutableUint8Array(value) : IsRegExp(value) ? ImmutableRegExp(value) : IsObject2(value) ? ImmutableObject(value) : value;
}
var init_immutable = () => {};

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/clone/value.mjs
function ArrayType(value) {
  return value.map((value2) => Visit(value2));
}
function DateType(value) {
  return new Date(value.getTime());
}
function Uint8ArrayType(value) {
  return new Uint8Array(value);
}
function RegExpType(value) {
  return new RegExp(value.source, value.flags);
}
function ObjectType(value) {
  const result = {};
  for (const key of Object.getOwnPropertyNames(value)) {
    result[key] = Visit(value[key]);
  }
  for (const key of Object.getOwnPropertySymbols(value)) {
    result[key] = Visit(value[key]);
  }
  return result;
}
function Visit(value) {
  return IsArray2(value) ? ArrayType(value) : IsDate2(value) ? DateType(value) : IsUint8Array2(value) ? Uint8ArrayType(value) : IsRegExp(value) ? RegExpType(value) : IsObject2(value) ? ObjectType(value) : value;
}
function Clone(value) {
  return Visit(value);
}
var init_value = () => {};

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/create/type.mjs
function CreateType(schema, options) {
  const result = options !== undefined ? { ...options, ...schema } : schema;
  switch (TypeSystemPolicy.InstanceMode) {
    case "freeze":
      return Immutable(result);
    case "clone":
      return Clone(result);
    default:
      return result;
  }
}
var init_type2 = __esm(() => {
  init_policy();
  init_immutable();
  init_value();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/symbols/symbols.mjs
var TransformKind, ReadonlyKind, OptionalKind, Hint, Kind;
var init_symbols = __esm(() => {
  TransformKind = Symbol.for("TypeBox.Transform");
  ReadonlyKind = Symbol.for("TypeBox.Readonly");
  OptionalKind = Symbol.for("TypeBox.Optional");
  Hint = Symbol.for("TypeBox.Hint");
  Kind = Symbol.for("TypeBox.Kind");
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/symbols/index.mjs
var init_symbols2 = __esm(() => {
  init_symbols();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/unsafe/unsafe.mjs
function Unsafe(options = {}) {
  return CreateType({ [Kind]: options[Kind] ?? "Unsafe" }, options);
}
var init_unsafe = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/unsafe/index.mjs
var init_unsafe2 = __esm(() => {
  init_unsafe();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/error/error.mjs
var TypeBoxError;
var init_error = __esm(() => {
  TypeBoxError = class TypeBoxError extends Error {
    constructor(message2) {
      super(message2);
    }
  };
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/error/index.mjs
var init_error2 = __esm(() => {
  init_error();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/system/system.mjs
var TypeSystemDuplicateTypeKind, TypeSystemDuplicateFormat, TypeSystem;
var init_system = __esm(() => {
  init_registry();
  init_unsafe2();
  init_symbols2();
  init_error2();
  TypeSystemDuplicateTypeKind = class TypeSystemDuplicateTypeKind extends TypeBoxError {
    constructor(kind) {
      super(`Duplicate type kind '${kind}' detected`);
    }
  };
  TypeSystemDuplicateFormat = class TypeSystemDuplicateFormat extends TypeBoxError {
    constructor(kind) {
      super(`Duplicate string format '${kind}' detected`);
    }
  };
  (function(TypeSystem2) {
    function Type(kind, check) {
      if (exports_type.Has(kind))
        throw new TypeSystemDuplicateTypeKind(kind);
      exports_type.Set(kind, check);
      return (options = {}) => Unsafe({ ...options, [Kind]: kind });
    }
    TypeSystem2.Type = Type;
    function Format(format, check) {
      if (exports_format.Has(format))
        throw new TypeSystemDuplicateFormat(format);
      exports_format.Set(format, check);
      return format;
    }
    TypeSystem2.Format = Format;
  })(TypeSystem || (TypeSystem = {}));
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/system/index.mjs
var init_system2 = __esm(() => {
  init_policy();
  init_system();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/mapped/mapped-key.mjs
var init_mapped_key = () => {};

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/mapped/mapped-result.mjs
function MappedResult(properties) {
  return CreateType({
    [Kind]: "MappedResult",
    properties
  });
}
var init_mapped_result = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/discard/discard.mjs
function DiscardKey(value, key) {
  const { [key]: _, ...rest } = value;
  return rest;
}
function Discard(value, keys) {
  return keys.reduce((acc, key) => DiscardKey(acc, key), value);
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/discard/index.mjs
var init_discard = () => {};

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/array/array.mjs
function Array2(items, options) {
  return CreateType({ [Kind]: "Array", type: "array", items }, options);
}
var init_array = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/array/index.mjs
var init_array2 = __esm(() => {
  init_array();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/async-iterator/async-iterator.mjs
function AsyncIterator(items, options) {
  return CreateType({ [Kind]: "AsyncIterator", type: "AsyncIterator", items }, options);
}
var init_async_iterator = __esm(() => {
  init_symbols2();
  init_type2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/async-iterator/index.mjs
var init_async_iterator2 = __esm(() => {
  init_async_iterator();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/constructor/constructor.mjs
function Constructor(parameters, returns, options) {
  return CreateType({ [Kind]: "Constructor", type: "Constructor", parameters, returns }, options);
}
var init_constructor = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/constructor/index.mjs
var init_constructor2 = __esm(() => {
  init_constructor();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/function/function.mjs
function Function2(parameters, returns, options) {
  return CreateType({ [Kind]: "Function", type: "Function", parameters, returns }, options);
}
var init_function = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/function/index.mjs
var init_function2 = __esm(() => {
  init_function();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/create/index.mjs
var init_create = __esm(() => {
  init_type2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/computed/computed.mjs
function Computed(target, parameters, options) {
  return CreateType({ [Kind]: "Computed", target, parameters }, options);
}
var init_computed = __esm(() => {
  init_create();
  init_symbols();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/computed/index.mjs
var init_computed2 = __esm(() => {
  init_computed();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/never/never.mjs
function Never(options) {
  return CreateType({ [Kind]: "Never", not: {} }, options);
}
var init_never = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/never/index.mjs
var init_never2 = __esm(() => {
  init_never();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/guard/kind.mjs
function IsReadonly(value) {
  return IsObject2(value) && value[ReadonlyKind] === "Readonly";
}
function IsOptional(value) {
  return IsObject2(value) && value[OptionalKind] === "Optional";
}
function IsAny(value) {
  return IsKindOf(value, "Any");
}
function IsArgument(value) {
  return IsKindOf(value, "Argument");
}
function IsArray3(value) {
  return IsKindOf(value, "Array");
}
function IsAsyncIterator3(value) {
  return IsKindOf(value, "AsyncIterator");
}
function IsBigInt3(value) {
  return IsKindOf(value, "BigInt");
}
function IsBoolean3(value) {
  return IsKindOf(value, "Boolean");
}
function IsComputed(value) {
  return IsKindOf(value, "Computed");
}
function IsConstructor(value) {
  return IsKindOf(value, "Constructor");
}
function IsDate3(value) {
  return IsKindOf(value, "Date");
}
function IsFunction3(value) {
  return IsKindOf(value, "Function");
}
function IsInteger2(value) {
  return IsKindOf(value, "Integer");
}
function IsIntersect(value) {
  return IsKindOf(value, "Intersect");
}
function IsIterator3(value) {
  return IsKindOf(value, "Iterator");
}
function IsKindOf(value, kind) {
  return IsObject2(value) && Kind in value && value[Kind] === kind;
}
function IsLiteralValue(value) {
  return IsBoolean2(value) || IsNumber2(value) || IsString2(value);
}
function IsLiteral(value) {
  return IsKindOf(value, "Literal");
}
function IsMappedKey(value) {
  return IsKindOf(value, "MappedKey");
}
function IsMappedResult(value) {
  return IsKindOf(value, "MappedResult");
}
function IsNever(value) {
  return IsKindOf(value, "Never");
}
function IsNot(value) {
  return IsKindOf(value, "Not");
}
function IsNull3(value) {
  return IsKindOf(value, "Null");
}
function IsNumber3(value) {
  return IsKindOf(value, "Number");
}
function IsObject3(value) {
  return IsKindOf(value, "Object");
}
function IsPromise2(value) {
  return IsKindOf(value, "Promise");
}
function IsRecord(value) {
  return IsKindOf(value, "Record");
}
function IsRef(value) {
  return IsKindOf(value, "Ref");
}
function IsRegExp2(value) {
  return IsKindOf(value, "RegExp");
}
function IsString3(value) {
  return IsKindOf(value, "String");
}
function IsSymbol3(value) {
  return IsKindOf(value, "Symbol");
}
function IsTemplateLiteral(value) {
  return IsKindOf(value, "TemplateLiteral");
}
function IsThis(value) {
  return IsKindOf(value, "This");
}
function IsTransform(value) {
  return IsObject2(value) && TransformKind in value;
}
function IsTuple(value) {
  return IsKindOf(value, "Tuple");
}
function IsUndefined3(value) {
  return IsKindOf(value, "Undefined");
}
function IsUnion(value) {
  return IsKindOf(value, "Union");
}
function IsUint8Array3(value) {
  return IsKindOf(value, "Uint8Array");
}
function IsUnknown(value) {
  return IsKindOf(value, "Unknown");
}
function IsUnsafe(value) {
  return IsKindOf(value, "Unsafe");
}
function IsVoid(value) {
  return IsKindOf(value, "Void");
}
function IsKind(value) {
  return IsObject2(value) && Kind in value && IsString2(value[Kind]);
}
function IsSchema(value) {
  return IsAny(value) || IsArgument(value) || IsArray3(value) || IsBoolean3(value) || IsBigInt3(value) || IsAsyncIterator3(value) || IsComputed(value) || IsConstructor(value) || IsDate3(value) || IsFunction3(value) || IsInteger2(value) || IsIntersect(value) || IsIterator3(value) || IsLiteral(value) || IsMappedKey(value) || IsMappedResult(value) || IsNever(value) || IsNot(value) || IsNull3(value) || IsNumber3(value) || IsObject3(value) || IsPromise2(value) || IsRecord(value) || IsRef(value) || IsRegExp2(value) || IsString3(value) || IsSymbol3(value) || IsTemplateLiteral(value) || IsThis(value) || IsTuple(value) || IsUndefined3(value) || IsUnion(value) || IsUint8Array3(value) || IsUnknown(value) || IsUnsafe(value) || IsVoid(value) || IsKind(value);
}
var init_kind = __esm(() => {
  init_symbols2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/optional/optional.mjs
function RemoveOptional(schema) {
  return CreateType(Discard(schema, [OptionalKind]));
}
function AddOptional(schema) {
  return CreateType({ ...schema, [OptionalKind]: "Optional" });
}
function OptionalWithFlag(schema, F) {
  return F === false ? RemoveOptional(schema) : AddOptional(schema);
}
function Optional(schema, enable) {
  const F = enable ?? true;
  return IsMappedResult(schema) ? OptionalFromMappedResult(schema, F) : OptionalWithFlag(schema, F);
}
var init_optional = __esm(() => {
  init_type2();
  init_symbols2();
  init_discard();
  init_optional_from_mapped_result();
  init_kind();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/optional/optional-from-mapped-result.mjs
function FromProperties(P, F) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(P))
    Acc[K2] = Optional(P[K2], F);
  return Acc;
}
function FromMappedResult(R, F) {
  return FromProperties(R.properties, F);
}
function OptionalFromMappedResult(R, F) {
  const P = FromMappedResult(R, F);
  return MappedResult(P);
}
var init_optional_from_mapped_result = __esm(() => {
  init_mapped2();
  init_optional();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/optional/index.mjs
var init_optional2 = __esm(() => {
  init_optional_from_mapped_result();
  init_optional();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/intersect/intersect-create.mjs
function IntersectCreate(T, options = {}) {
  const allObjects = T.every((schema) => IsObject3(schema));
  const clonedUnevaluatedProperties = IsSchema(options.unevaluatedProperties) ? { unevaluatedProperties: options.unevaluatedProperties } : {};
  return CreateType(options.unevaluatedProperties === false || IsSchema(options.unevaluatedProperties) || allObjects ? { ...clonedUnevaluatedProperties, [Kind]: "Intersect", type: "object", allOf: T } : { ...clonedUnevaluatedProperties, [Kind]: "Intersect", allOf: T }, options);
}
var init_intersect_create = __esm(() => {
  init_type2();
  init_symbols2();
  init_kind();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/intersect/intersect-evaluated.mjs
function IsIntersectOptional(types) {
  return types.every((left) => IsOptional(left));
}
function RemoveOptionalFromType(type2) {
  return Discard(type2, [OptionalKind]);
}
function RemoveOptionalFromRest(types) {
  return types.map((left) => IsOptional(left) ? RemoveOptionalFromType(left) : left);
}
function ResolveIntersect(types, options) {
  return IsIntersectOptional(types) ? Optional(IntersectCreate(RemoveOptionalFromRest(types), options)) : IntersectCreate(RemoveOptionalFromRest(types), options);
}
function IntersectEvaluated(types, options = {}) {
  if (types.length === 1)
    return CreateType(types[0], options);
  if (types.length === 0)
    return Never(options);
  if (types.some((schema) => IsTransform(schema)))
    throw new Error("Cannot intersect transform types");
  return ResolveIntersect(types, options);
}
var init_intersect_evaluated = __esm(() => {
  init_symbols2();
  init_type2();
  init_discard();
  init_never2();
  init_optional2();
  init_intersect_create();
  init_kind();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/intersect/intersect-type.mjs
var init_intersect_type = () => {};

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/intersect/intersect.mjs
function Intersect(types, options) {
  if (types.length === 1)
    return CreateType(types[0], options);
  if (types.length === 0)
    return Never(options);
  if (types.some((schema) => IsTransform(schema)))
    throw new Error("Cannot intersect transform types");
  return IntersectCreate(types, options);
}
var init_intersect = __esm(() => {
  init_type2();
  init_never2();
  init_intersect_create();
  init_kind();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/intersect/index.mjs
var init_intersect2 = __esm(() => {
  init_intersect_evaluated();
  init_intersect_type();
  init_intersect();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/union/union-create.mjs
function UnionCreate(T, options) {
  return CreateType({ [Kind]: "Union", anyOf: T }, options);
}
var init_union_create = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/union/union-evaluated.mjs
function IsUnionOptional(types) {
  return types.some((type2) => IsOptional(type2));
}
function RemoveOptionalFromRest2(types) {
  return types.map((left) => IsOptional(left) ? RemoveOptionalFromType2(left) : left);
}
function RemoveOptionalFromType2(T) {
  return Discard(T, [OptionalKind]);
}
function ResolveUnion(types, options) {
  const isOptional = IsUnionOptional(types);
  return isOptional ? Optional(UnionCreate(RemoveOptionalFromRest2(types), options)) : UnionCreate(RemoveOptionalFromRest2(types), options);
}
function UnionEvaluated(T, options) {
  return T.length === 1 ? CreateType(T[0], options) : T.length === 0 ? Never(options) : ResolveUnion(T, options);
}
var init_union_evaluated = __esm(() => {
  init_type2();
  init_symbols2();
  init_discard();
  init_never2();
  init_optional2();
  init_union_create();
  init_kind();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/union/union-type.mjs
var init_union_type = () => {};

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/union/union.mjs
function Union(types, options) {
  return types.length === 0 ? Never(options) : types.length === 1 ? CreateType(types[0], options) : UnionCreate(types, options);
}
var init_union = __esm(() => {
  init_never2();
  init_type2();
  init_union_create();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/union/index.mjs
var init_union2 = __esm(() => {
  init_union_evaluated();
  init_union_type();
  init_union();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/template-literal/parse.mjs
function Unescape(pattern) {
  return pattern.replace(/\\\$/g, "$").replace(/\\\*/g, "*").replace(/\\\^/g, "^").replace(/\\\|/g, "|").replace(/\\\(/g, "(").replace(/\\\)/g, ")");
}
function IsNonEscaped(pattern, index, char) {
  return pattern[index] === char && pattern.charCodeAt(index - 1) !== 92;
}
function IsOpenParen(pattern, index) {
  return IsNonEscaped(pattern, index, "(");
}
function IsCloseParen(pattern, index) {
  return IsNonEscaped(pattern, index, ")");
}
function IsSeparator(pattern, index) {
  return IsNonEscaped(pattern, index, "|");
}
function IsGroup(pattern) {
  if (!(IsOpenParen(pattern, 0) && IsCloseParen(pattern, pattern.length - 1)))
    return false;
  let count = 0;
  for (let index = 0;index < pattern.length; index++) {
    if (IsOpenParen(pattern, index))
      count += 1;
    if (IsCloseParen(pattern, index))
      count -= 1;
    if (count === 0 && index !== pattern.length - 1)
      return false;
  }
  return true;
}
function InGroup(pattern) {
  return pattern.slice(1, pattern.length - 1);
}
function IsPrecedenceOr(pattern) {
  let count = 0;
  for (let index = 0;index < pattern.length; index++) {
    if (IsOpenParen(pattern, index))
      count += 1;
    if (IsCloseParen(pattern, index))
      count -= 1;
    if (IsSeparator(pattern, index) && count === 0)
      return true;
  }
  return false;
}
function IsPrecedenceAnd(pattern) {
  for (let index = 0;index < pattern.length; index++) {
    if (IsOpenParen(pattern, index))
      return true;
  }
  return false;
}
function Or(pattern) {
  let [count, start] = [0, 0];
  const expressions = [];
  for (let index = 0;index < pattern.length; index++) {
    if (IsOpenParen(pattern, index))
      count += 1;
    if (IsCloseParen(pattern, index))
      count -= 1;
    if (IsSeparator(pattern, index) && count === 0) {
      const range2 = pattern.slice(start, index);
      if (range2.length > 0)
        expressions.push(TemplateLiteralParse(range2));
      start = index + 1;
    }
  }
  const range = pattern.slice(start);
  if (range.length > 0)
    expressions.push(TemplateLiteralParse(range));
  if (expressions.length === 0)
    return { type: "const", const: "" };
  if (expressions.length === 1)
    return expressions[0];
  return { type: "or", expr: expressions };
}
function And(pattern) {
  function Group(value, index) {
    if (!IsOpenParen(value, index))
      throw new TemplateLiteralParserError(`TemplateLiteralParser: Index must point to open parens`);
    let count = 0;
    for (let scan = index;scan < value.length; scan++) {
      if (IsOpenParen(value, scan))
        count += 1;
      if (IsCloseParen(value, scan))
        count -= 1;
      if (count === 0)
        return [index, scan];
    }
    throw new TemplateLiteralParserError(`TemplateLiteralParser: Unclosed group parens in expression`);
  }
  function Range(pattern2, index) {
    for (let scan = index;scan < pattern2.length; scan++) {
      if (IsOpenParen(pattern2, scan))
        return [index, scan];
    }
    return [index, pattern2.length];
  }
  const expressions = [];
  for (let index = 0;index < pattern.length; index++) {
    if (IsOpenParen(pattern, index)) {
      const [start, end] = Group(pattern, index);
      const range = pattern.slice(start, end + 1);
      expressions.push(TemplateLiteralParse(range));
      index = end;
    } else {
      const [start, end] = Range(pattern, index);
      const range = pattern.slice(start, end);
      if (range.length > 0)
        expressions.push(TemplateLiteralParse(range));
      index = end - 1;
    }
  }
  return expressions.length === 0 ? { type: "const", const: "" } : expressions.length === 1 ? expressions[0] : { type: "and", expr: expressions };
}
function TemplateLiteralParse(pattern) {
  return IsGroup(pattern) ? TemplateLiteralParse(InGroup(pattern)) : IsPrecedenceOr(pattern) ? Or(pattern) : IsPrecedenceAnd(pattern) ? And(pattern) : { type: "const", const: Unescape(pattern) };
}
function TemplateLiteralParseExact(pattern) {
  return TemplateLiteralParse(pattern.slice(1, pattern.length - 1));
}
var TemplateLiteralParserError;
var init_parse = __esm(() => {
  init_error2();
  TemplateLiteralParserError = class TemplateLiteralParserError extends TypeBoxError {
  };
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/template-literal/finite.mjs
function IsNumberExpression(expression) {
  return expression.type === "or" && expression.expr.length === 2 && expression.expr[0].type === "const" && expression.expr[0].const === "0" && expression.expr[1].type === "const" && expression.expr[1].const === "[1-9][0-9]*";
}
function IsBooleanExpression(expression) {
  return expression.type === "or" && expression.expr.length === 2 && expression.expr[0].type === "const" && expression.expr[0].const === "true" && expression.expr[1].type === "const" && expression.expr[1].const === "false";
}
function IsStringExpression(expression) {
  return expression.type === "const" && expression.const === ".*";
}
function IsTemplateLiteralExpressionFinite(expression) {
  return IsNumberExpression(expression) || IsStringExpression(expression) ? false : IsBooleanExpression(expression) ? true : expression.type === "and" ? expression.expr.every((expr) => IsTemplateLiteralExpressionFinite(expr)) : expression.type === "or" ? expression.expr.every((expr) => IsTemplateLiteralExpressionFinite(expr)) : expression.type === "const" ? true : (() => {
    throw new TemplateLiteralFiniteError(`Unknown expression type`);
  })();
}
function IsTemplateLiteralFinite(schema) {
  const expression = TemplateLiteralParseExact(schema.pattern);
  return IsTemplateLiteralExpressionFinite(expression);
}
var TemplateLiteralFiniteError;
var init_finite = __esm(() => {
  init_parse();
  init_error2();
  TemplateLiteralFiniteError = class TemplateLiteralFiniteError extends TypeBoxError {
  };
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/template-literal/generate.mjs
function* GenerateReduce(buffer) {
  if (buffer.length === 1)
    return yield* buffer[0];
  for (const left of buffer[0]) {
    for (const right of GenerateReduce(buffer.slice(1))) {
      yield `${left}${right}`;
    }
  }
}
function* GenerateAnd(expression) {
  return yield* GenerateReduce(expression.expr.map((expr) => [...TemplateLiteralExpressionGenerate(expr)]));
}
function* GenerateOr(expression) {
  for (const expr of expression.expr)
    yield* TemplateLiteralExpressionGenerate(expr);
}
function* GenerateConst(expression) {
  return yield expression.const;
}
function* TemplateLiteralExpressionGenerate(expression) {
  return expression.type === "and" ? yield* GenerateAnd(expression) : expression.type === "or" ? yield* GenerateOr(expression) : expression.type === "const" ? yield* GenerateConst(expression) : (() => {
    throw new TemplateLiteralGenerateError("Unknown expression");
  })();
}
function TemplateLiteralGenerate(schema) {
  const expression = TemplateLiteralParseExact(schema.pattern);
  return IsTemplateLiteralExpressionFinite(expression) ? [...TemplateLiteralExpressionGenerate(expression)] : [];
}
var TemplateLiteralGenerateError;
var init_generate = __esm(() => {
  init_finite();
  init_parse();
  init_error2();
  TemplateLiteralGenerateError = class TemplateLiteralGenerateError extends TypeBoxError {
  };
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/literal/literal.mjs
function Literal(value, options) {
  return CreateType({
    [Kind]: "Literal",
    const: value,
    type: typeof value
  }, options);
}
var init_literal = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/literal/index.mjs
var init_literal2 = __esm(() => {
  init_literal();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/boolean/boolean.mjs
function Boolean2(options) {
  return CreateType({ [Kind]: "Boolean", type: "boolean" }, options);
}
var init_boolean = __esm(() => {
  init_symbols2();
  init_create();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/boolean/index.mjs
var init_boolean2 = __esm(() => {
  init_boolean();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/bigint/bigint.mjs
function BigInt2(options) {
  return CreateType({ [Kind]: "BigInt", type: "bigint" }, options);
}
var init_bigint = __esm(() => {
  init_symbols2();
  init_create();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/bigint/index.mjs
var init_bigint2 = __esm(() => {
  init_bigint();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/number/number.mjs
function Number2(options) {
  return CreateType({ [Kind]: "Number", type: "number" }, options);
}
var init_number = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/number/index.mjs
var init_number2 = __esm(() => {
  init_number();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/string/string.mjs
function String2(options) {
  return CreateType({ [Kind]: "String", type: "string" }, options);
}
var init_string = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/string/index.mjs
var init_string2 = __esm(() => {
  init_string();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/template-literal/syntax.mjs
function* FromUnion(syntax) {
  const trim = syntax.trim().replace(/"|'/g, "");
  return trim === "boolean" ? yield Boolean2() : trim === "number" ? yield Number2() : trim === "bigint" ? yield BigInt2() : trim === "string" ? yield String2() : yield (() => {
    const literals = trim.split("|").map((literal2) => Literal(literal2.trim()));
    return literals.length === 0 ? Never() : literals.length === 1 ? literals[0] : UnionEvaluated(literals);
  })();
}
function* FromTerminal(syntax) {
  if (syntax[1] !== "{") {
    const L = Literal("$");
    const R = FromSyntax(syntax.slice(1));
    return yield* [L, ...R];
  }
  for (let i = 2;i < syntax.length; i++) {
    if (syntax[i] === "}") {
      const L = FromUnion(syntax.slice(2, i));
      const R = FromSyntax(syntax.slice(i + 1));
      return yield* [...L, ...R];
    }
  }
  yield Literal(syntax);
}
function* FromSyntax(syntax) {
  for (let i = 0;i < syntax.length; i++) {
    if (syntax[i] === "$") {
      const L = Literal(syntax.slice(0, i));
      const R = FromTerminal(syntax.slice(i));
      return yield* [L, ...R];
    }
  }
  yield Literal(syntax);
}
function TemplateLiteralSyntax(syntax) {
  return [...FromSyntax(syntax)];
}
var init_syntax = __esm(() => {
  init_literal2();
  init_boolean2();
  init_bigint2();
  init_number2();
  init_string2();
  init_union2();
  init_never2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/patterns/patterns.mjs
var PatternBoolean = "(true|false)", PatternNumber = "(0|[1-9][0-9]*)", PatternString = "(.*)", PatternNever = "(?!.*)", PatternBooleanExact, PatternNumberExact, PatternStringExact, PatternNeverExact;
var init_patterns = __esm(() => {
  PatternBooleanExact = `^${PatternBoolean}$`;
  PatternNumberExact = `^${PatternNumber}$`;
  PatternStringExact = `^${PatternString}$`;
  PatternNeverExact = `^${PatternNever}$`;
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/patterns/index.mjs
var init_patterns2 = __esm(() => {
  init_patterns();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/template-literal/pattern.mjs
function Escape(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function Visit2(schema, acc) {
  return IsTemplateLiteral(schema) ? schema.pattern.slice(1, schema.pattern.length - 1) : IsUnion(schema) ? `(${schema.anyOf.map((schema2) => Visit2(schema2, acc)).join("|")})` : IsNumber3(schema) ? `${acc}${PatternNumber}` : IsInteger2(schema) ? `${acc}${PatternNumber}` : IsBigInt3(schema) ? `${acc}${PatternNumber}` : IsString3(schema) ? `${acc}${PatternString}` : IsLiteral(schema) ? `${acc}${Escape(schema.const.toString())}` : IsBoolean3(schema) ? `${acc}${PatternBoolean}` : (() => {
    throw new TemplateLiteralPatternError(`Unexpected Kind '${schema[Kind]}'`);
  })();
}
function TemplateLiteralPattern(kinds) {
  return `^${kinds.map((schema) => Visit2(schema, "")).join("")}$`;
}
var TemplateLiteralPatternError;
var init_pattern = __esm(() => {
  init_patterns2();
  init_symbols2();
  init_error2();
  init_kind();
  TemplateLiteralPatternError = class TemplateLiteralPatternError extends TypeBoxError {
  };
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/template-literal/union.mjs
function TemplateLiteralToUnion(schema) {
  const R = TemplateLiteralGenerate(schema);
  const L = R.map((S) => Literal(S));
  return UnionEvaluated(L);
}
var init_union3 = __esm(() => {
  init_union2();
  init_literal2();
  init_generate();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/template-literal/template-literal.mjs
function TemplateLiteral(unresolved, options) {
  const pattern = IsString2(unresolved) ? TemplateLiteralPattern(TemplateLiteralSyntax(unresolved)) : TemplateLiteralPattern(unresolved);
  return CreateType({ [Kind]: "TemplateLiteral", type: "string", pattern }, options);
}
var init_template_literal = __esm(() => {
  init_type2();
  init_syntax();
  init_pattern();
  init_symbols2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/template-literal/index.mjs
var init_template_literal2 = __esm(() => {
  init_finite();
  init_generate();
  init_syntax();
  init_parse();
  init_pattern();
  init_union3();
  init_template_literal();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/indexed/indexed-property-keys.mjs
function FromTemplateLiteral(templateLiteral) {
  const keys = TemplateLiteralGenerate(templateLiteral);
  return keys.map((key) => key.toString());
}
function FromUnion2(types) {
  const result = [];
  for (const type2 of types)
    result.push(...IndexPropertyKeys(type2));
  return result;
}
function FromLiteral(literalValue) {
  return [literalValue.toString()];
}
function IndexPropertyKeys(type2) {
  return [...new Set(IsTemplateLiteral(type2) ? FromTemplateLiteral(type2) : IsUnion(type2) ? FromUnion2(type2.anyOf) : IsLiteral(type2) ? FromLiteral(type2.const) : IsNumber3(type2) ? ["[number]"] : IsInteger2(type2) ? ["[number]"] : [])];
}
var init_indexed_property_keys = __esm(() => {
  init_template_literal2();
  init_kind();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/indexed/indexed-from-mapped-result.mjs
function FromProperties2(type2, properties, options) {
  const result = {};
  for (const K2 of Object.getOwnPropertyNames(properties)) {
    result[K2] = Index(type2, IndexPropertyKeys(properties[K2]), options);
  }
  return result;
}
function FromMappedResult2(type2, mappedResult, options) {
  return FromProperties2(type2, mappedResult.properties, options);
}
function IndexFromMappedResult(type2, mappedResult, options) {
  const properties = FromMappedResult2(type2, mappedResult, options);
  return MappedResult(properties);
}
var init_indexed_from_mapped_result = __esm(() => {
  init_mapped2();
  init_indexed_property_keys();
  init_indexed2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/indexed/indexed.mjs
function FromRest(types, key) {
  return types.map((type2) => IndexFromPropertyKey(type2, key));
}
function FromIntersectRest(types) {
  return types.filter((type2) => !IsNever(type2));
}
function FromIntersect(types, key) {
  return IntersectEvaluated(FromIntersectRest(FromRest(types, key)));
}
function FromUnionRest(types) {
  return types.some((L) => IsNever(L)) ? [] : types;
}
function FromUnion3(types, key) {
  return UnionEvaluated(FromUnionRest(FromRest(types, key)));
}
function FromTuple(types, key) {
  return key in types ? types[key] : key === "[number]" ? UnionEvaluated(types) : Never();
}
function FromArray(type2, key) {
  return key === "[number]" ? type2 : Never();
}
function FromProperty(properties, propertyKey) {
  return propertyKey in properties ? properties[propertyKey] : Never();
}
function IndexFromPropertyKey(type2, propertyKey) {
  return IsIntersect(type2) ? FromIntersect(type2.allOf, propertyKey) : IsUnion(type2) ? FromUnion3(type2.anyOf, propertyKey) : IsTuple(type2) ? FromTuple(type2.items ?? [], propertyKey) : IsArray3(type2) ? FromArray(type2.items, propertyKey) : IsObject3(type2) ? FromProperty(type2.properties, propertyKey) : Never();
}
function IndexFromPropertyKeys(type2, propertyKeys) {
  return propertyKeys.map((propertyKey) => IndexFromPropertyKey(type2, propertyKey));
}
function FromSchema(type2, propertyKeys) {
  return UnionEvaluated(IndexFromPropertyKeys(type2, propertyKeys));
}
function Index(type2, key, options) {
  if (IsRef(type2) || IsRef(key)) {
    const error2 = `Index types using Ref parameters require both Type and Key to be of TSchema`;
    if (!IsSchema(type2) || !IsSchema(key))
      throw new TypeBoxError(error2);
    return Computed("Index", [type2, key]);
  }
  if (IsMappedResult(key))
    return IndexFromMappedResult(type2, key, options);
  if (IsMappedKey(key))
    return IndexFromMappedKey(type2, key, options);
  return CreateType(IsSchema(key) ? FromSchema(type2, IndexPropertyKeys(key)) : FromSchema(type2, key), options);
}
var init_indexed = __esm(() => {
  init_type2();
  init_error2();
  init_computed2();
  init_never2();
  init_intersect2();
  init_union2();
  init_indexed_property_keys();
  init_indexed_from_mapped_key();
  init_indexed_from_mapped_result();
  init_kind();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/indexed/indexed-from-mapped-key.mjs
function MappedIndexPropertyKey(type2, key, options) {
  return { [key]: Index(type2, [key], Clone(options)) };
}
function MappedIndexPropertyKeys(type2, propertyKeys, options) {
  return propertyKeys.reduce((result, left) => {
    return { ...result, ...MappedIndexPropertyKey(type2, left, options) };
  }, {});
}
function MappedIndexProperties(type2, mappedKey, options) {
  return MappedIndexPropertyKeys(type2, mappedKey.keys, options);
}
function IndexFromMappedKey(type2, mappedKey, options) {
  const properties = MappedIndexProperties(type2, mappedKey, options);
  return MappedResult(properties);
}
var init_indexed_from_mapped_key = __esm(() => {
  init_indexed();
  init_mapped2();
  init_value();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/indexed/index.mjs
var init_indexed2 = __esm(() => {
  init_indexed_from_mapped_key();
  init_indexed_from_mapped_result();
  init_indexed_property_keys();
  init_indexed();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/iterator/iterator.mjs
function Iterator(items, options) {
  return CreateType({ [Kind]: "Iterator", type: "Iterator", items }, options);
}
var init_iterator = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/iterator/index.mjs
var init_iterator2 = __esm(() => {
  init_iterator();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/object/object.mjs
function RequiredArray(properties) {
  return globalThis.Object.keys(properties).filter((key) => !IsOptional(properties[key]));
}
function _Object(properties, options) {
  const required = RequiredArray(properties);
  const schema = required.length > 0 ? { [Kind]: "Object", type: "object", required, properties } : { [Kind]: "Object", type: "object", properties };
  return CreateType(schema, options);
}
var Object2;
var init_object = __esm(() => {
  init_type2();
  init_symbols2();
  init_kind();
  Object2 = _Object;
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/object/index.mjs
var init_object2 = __esm(() => {
  init_object();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/promise/promise.mjs
function Promise2(item, options) {
  return CreateType({ [Kind]: "Promise", type: "Promise", item }, options);
}
var init_promise = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/promise/index.mjs
var init_promise2 = __esm(() => {
  init_promise();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/readonly/readonly.mjs
function RemoveReadonly(schema) {
  return CreateType(Discard(schema, [ReadonlyKind]));
}
function AddReadonly(schema) {
  return CreateType({ ...schema, [ReadonlyKind]: "Readonly" });
}
function ReadonlyWithFlag(schema, F) {
  return F === false ? RemoveReadonly(schema) : AddReadonly(schema);
}
function Readonly(schema, enable) {
  const F = enable ?? true;
  return IsMappedResult(schema) ? ReadonlyFromMappedResult(schema, F) : ReadonlyWithFlag(schema, F);
}
var init_readonly = __esm(() => {
  init_type2();
  init_symbols2();
  init_discard();
  init_readonly_from_mapped_result();
  init_kind();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/readonly/readonly-from-mapped-result.mjs
function FromProperties3(K, F) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(K))
    Acc[K2] = Readonly(K[K2], F);
  return Acc;
}
function FromMappedResult3(R, F) {
  return FromProperties3(R.properties, F);
}
function ReadonlyFromMappedResult(R, F) {
  const P = FromMappedResult3(R, F);
  return MappedResult(P);
}
var init_readonly_from_mapped_result = __esm(() => {
  init_mapped2();
  init_readonly();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/readonly/index.mjs
var init_readonly2 = __esm(() => {
  init_readonly_from_mapped_result();
  init_readonly();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/tuple/tuple.mjs
function Tuple(types, options) {
  return CreateType(types.length > 0 ? { [Kind]: "Tuple", type: "array", items: types, additionalItems: false, minItems: types.length, maxItems: types.length } : { [Kind]: "Tuple", type: "array", minItems: types.length, maxItems: types.length }, options);
}
var init_tuple = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/tuple/index.mjs
var init_tuple2 = __esm(() => {
  init_tuple();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/sets/set.mjs
function SetIncludes(T, S) {
  return T.includes(S);
}
function SetDistinct(T) {
  return [...new Set(T)];
}
function SetIntersect(T, S) {
  return T.filter((L) => S.includes(L));
}
function SetIntersectManyResolve(T, Init) {
  return T.reduce((Acc, L) => {
    return SetIntersect(Acc, L);
  }, Init);
}
function SetIntersectMany(T) {
  return T.length === 1 ? T[0] : T.length > 1 ? SetIntersectManyResolve(T.slice(1), T[0]) : [];
}
function SetUnionMany(T) {
  const Acc = [];
  for (const L of T)
    Acc.push(...L);
  return Acc;
}

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/sets/index.mjs
var init_sets = () => {};

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/mapped/mapped.mjs
function FromMappedResult4(K, P) {
  return K in P ? FromSchemaType(K, P[K]) : MappedResult(P);
}
function MappedKeyToKnownMappedResultProperties(K) {
  return { [K]: Literal(K) };
}
function MappedKeyToUnknownMappedResultProperties(P) {
  const Acc = {};
  for (const L of P)
    Acc[L] = Literal(L);
  return Acc;
}
function MappedKeyToMappedResultProperties(K, P) {
  return SetIncludes(P, K) ? MappedKeyToKnownMappedResultProperties(K) : MappedKeyToUnknownMappedResultProperties(P);
}
function FromMappedKey(K, P) {
  const R = MappedKeyToMappedResultProperties(K, P);
  return FromMappedResult4(K, R);
}
function FromRest2(K, T) {
  return T.map((L) => FromSchemaType(K, L));
}
function FromProperties4(K, T) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(T))
    Acc[K2] = FromSchemaType(K, T[K2]);
  return Acc;
}
function FromSchemaType(K, T) {
  const options = { ...T };
  return IsOptional(T) ? Optional(FromSchemaType(K, Discard(T, [OptionalKind]))) : IsReadonly(T) ? Readonly(FromSchemaType(K, Discard(T, [ReadonlyKind]))) : IsMappedResult(T) ? FromMappedResult4(K, T.properties) : IsMappedKey(T) ? FromMappedKey(K, T.keys) : IsConstructor(T) ? Constructor(FromRest2(K, T.parameters), FromSchemaType(K, T.returns), options) : IsFunction3(T) ? Function2(FromRest2(K, T.parameters), FromSchemaType(K, T.returns), options) : IsAsyncIterator3(T) ? AsyncIterator(FromSchemaType(K, T.items), options) : IsIterator3(T) ? Iterator(FromSchemaType(K, T.items), options) : IsIntersect(T) ? Intersect(FromRest2(K, T.allOf), options) : IsUnion(T) ? Union(FromRest2(K, T.anyOf), options) : IsTuple(T) ? Tuple(FromRest2(K, T.items ?? []), options) : IsObject3(T) ? Object2(FromProperties4(K, T.properties), options) : IsArray3(T) ? Array2(FromSchemaType(K, T.items), options) : IsPromise2(T) ? Promise2(FromSchemaType(K, T.item), options) : T;
}
function MappedFunctionReturnType(K, T) {
  const Acc = {};
  for (const L of K)
    Acc[L] = FromSchemaType(L, T);
  return Acc;
}
function Mapped(key, map3, options) {
  const K = IsSchema(key) ? IndexPropertyKeys(key) : key;
  const RT = map3({ [Kind]: "MappedKey", keys: K });
  const R = MappedFunctionReturnType(K, RT);
  return Object2(R, options);
}
var init_mapped = __esm(() => {
  init_symbols2();
  init_discard();
  init_array2();
  init_async_iterator2();
  init_constructor2();
  init_function2();
  init_indexed2();
  init_intersect2();
  init_iterator2();
  init_literal2();
  init_object2();
  init_optional2();
  init_promise2();
  init_readonly2();
  init_tuple2();
  init_union2();
  init_sets();
  init_mapped_result();
  init_kind();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/mapped/index.mjs
var init_mapped2 = __esm(() => {
  init_mapped_key();
  init_mapped_result();
  init_mapped();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/ref/ref.mjs
function Ref(...args2) {
  const [$ref, options] = typeof args2[0] === "string" ? [args2[0], args2[1]] : [args2[0].$id, args2[1]];
  if (typeof $ref !== "string")
    throw new TypeBoxError("Ref: $ref must be a string");
  return CreateType({ [Kind]: "Ref", $ref }, options);
}
var init_ref = __esm(() => {
  init_error2();
  init_type2();
  init_symbols2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/ref/index.mjs
var init_ref2 = __esm(() => {
  init_ref();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/keyof/keyof-property-keys.mjs
function FromRest3(types) {
  const result = [];
  for (const L of types)
    result.push(KeyOfPropertyKeys(L));
  return result;
}
function FromIntersect2(types) {
  const propertyKeysArray = FromRest3(types);
  const propertyKeys = SetUnionMany(propertyKeysArray);
  return propertyKeys;
}
function FromUnion4(types) {
  const propertyKeysArray = FromRest3(types);
  const propertyKeys = SetIntersectMany(propertyKeysArray);
  return propertyKeys;
}
function FromTuple2(types) {
  return types.map((_, indexer) => indexer.toString());
}
function FromArray2(_) {
  return ["[number]"];
}
function FromProperties5(T) {
  return globalThis.Object.getOwnPropertyNames(T);
}
function FromPatternProperties(patternProperties) {
  if (!includePatternProperties)
    return [];
  const patternPropertyKeys = globalThis.Object.getOwnPropertyNames(patternProperties);
  return patternPropertyKeys.map((key) => {
    return key[0] === "^" && key[key.length - 1] === "$" ? key.slice(1, key.length - 1) : key;
  });
}
function KeyOfPropertyKeys(type2) {
  return IsIntersect(type2) ? FromIntersect2(type2.allOf) : IsUnion(type2) ? FromUnion4(type2.anyOf) : IsTuple(type2) ? FromTuple2(type2.items ?? []) : IsArray3(type2) ? FromArray2(type2.items) : IsObject3(type2) ? FromProperties5(type2.properties) : IsRecord(type2) ? FromPatternProperties(type2.patternProperties) : [];
}
function KeyOfPattern(schema) {
  includePatternProperties = true;
  const keys = KeyOfPropertyKeys(schema);
  includePatternProperties = false;
  const pattern2 = keys.map((key) => `(${key})`);
  return `^(${pattern2.join("|")})$`;
}
var includePatternProperties = false;
var init_keyof_property_keys = __esm(() => {
  init_sets();
  init_kind();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/keyof/keyof.mjs
function FromComputed(target, parameters) {
  return Computed("KeyOf", [Computed(target, parameters)]);
}
function FromRef($ref) {
  return Computed("KeyOf", [Ref($ref)]);
}
function KeyOfFromType(type2, options) {
  const propertyKeys = KeyOfPropertyKeys(type2);
  const propertyKeyTypes = KeyOfPropertyKeysToRest(propertyKeys);
  const result = UnionEvaluated(propertyKeyTypes);
  return CreateType(result, options);
}
function KeyOfPropertyKeysToRest(propertyKeys) {
  return propertyKeys.map((L) => L === "[number]" ? Number2() : Literal(L));
}
function KeyOf(type2, options) {
  return IsComputed(type2) ? FromComputed(type2.target, type2.parameters) : IsRef(type2) ? FromRef(type2.$ref) : IsMappedResult(type2) ? KeyOfFromMappedResult(type2, options) : KeyOfFromType(type2, options);
}
var init_keyof = __esm(() => {
  init_type2();
  init_literal2();
  init_number2();
  init_computed2();
  init_ref2();
  init_keyof_property_keys();
  init_union2();
  init_keyof_from_mapped_result();
  init_kind();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/keyof/keyof-from-mapped-result.mjs
function FromProperties6(properties, options) {
  const result = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(properties))
    result[K2] = KeyOf(properties[K2], Clone(options));
  return result;
}
function FromMappedResult5(mappedResult, options) {
  return FromProperties6(mappedResult.properties, options);
}
function KeyOfFromMappedResult(mappedResult, options) {
  const properties = FromMappedResult5(mappedResult, options);
  return MappedResult(properties);
}
var init_keyof_from_mapped_result = __esm(() => {
  init_mapped2();
  init_keyof();
  init_value();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/keyof/keyof-property-entries.mjs
function KeyOfPropertyEntries(schema) {
  const keys = KeyOfPropertyKeys(schema);
  const schemas = IndexFromPropertyKeys(schema, keys);
  return keys.map((_, index) => [keys[index], schemas[index]]);
}
var init_keyof_property_entries = __esm(() => {
  init_indexed();
  init_keyof_property_keys();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/keyof/index.mjs
var init_keyof2 = __esm(() => {
  init_keyof_from_mapped_result();
  init_keyof_property_entries();
  init_keyof_property_keys();
  init_keyof();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/extends/extends-undefined.mjs
function Intersect2(schema) {
  return schema.allOf.every((schema2) => ExtendsUndefinedCheck(schema2));
}
function Union2(schema) {
  return schema.anyOf.some((schema2) => ExtendsUndefinedCheck(schema2));
}
function Not(schema) {
  return !ExtendsUndefinedCheck(schema.not);
}
function ExtendsUndefinedCheck(schema) {
  return schema[Kind] === "Intersect" ? Intersect2(schema) : schema[Kind] === "Union" ? Union2(schema) : schema[Kind] === "Not" ? Not(schema) : schema[Kind] === "Undefined" ? true : false;
}
var init_extends_undefined = __esm(() => {
  init_symbols2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/errors/function.mjs
function DefaultErrorFunction(error2) {
  switch (error2.errorType) {
    case ValueErrorType.ArrayContains:
      return "Expected array to contain at least one matching value";
    case ValueErrorType.ArrayMaxContains:
      return `Expected array to contain no more than ${error2.schema.maxContains} matching values`;
    case ValueErrorType.ArrayMinContains:
      return `Expected array to contain at least ${error2.schema.minContains} matching values`;
    case ValueErrorType.ArrayMaxItems:
      return `Expected array length to be less or equal to ${error2.schema.maxItems}`;
    case ValueErrorType.ArrayMinItems:
      return `Expected array length to be greater or equal to ${error2.schema.minItems}`;
    case ValueErrorType.ArrayUniqueItems:
      return "Expected array elements to be unique";
    case ValueErrorType.Array:
      return "Expected array";
    case ValueErrorType.AsyncIterator:
      return "Expected AsyncIterator";
    case ValueErrorType.BigIntExclusiveMaximum:
      return `Expected bigint to be less than ${error2.schema.exclusiveMaximum}`;
    case ValueErrorType.BigIntExclusiveMinimum:
      return `Expected bigint to be greater than ${error2.schema.exclusiveMinimum}`;
    case ValueErrorType.BigIntMaximum:
      return `Expected bigint to be less or equal to ${error2.schema.maximum}`;
    case ValueErrorType.BigIntMinimum:
      return `Expected bigint to be greater or equal to ${error2.schema.minimum}`;
    case ValueErrorType.BigIntMultipleOf:
      return `Expected bigint to be a multiple of ${error2.schema.multipleOf}`;
    case ValueErrorType.BigInt:
      return "Expected bigint";
    case ValueErrorType.Boolean:
      return "Expected boolean";
    case ValueErrorType.DateExclusiveMinimumTimestamp:
      return `Expected Date timestamp to be greater than ${error2.schema.exclusiveMinimumTimestamp}`;
    case ValueErrorType.DateExclusiveMaximumTimestamp:
      return `Expected Date timestamp to be less than ${error2.schema.exclusiveMaximumTimestamp}`;
    case ValueErrorType.DateMinimumTimestamp:
      return `Expected Date timestamp to be greater or equal to ${error2.schema.minimumTimestamp}`;
    case ValueErrorType.DateMaximumTimestamp:
      return `Expected Date timestamp to be less or equal to ${error2.schema.maximumTimestamp}`;
    case ValueErrorType.DateMultipleOfTimestamp:
      return `Expected Date timestamp to be a multiple of ${error2.schema.multipleOfTimestamp}`;
    case ValueErrorType.Date:
      return "Expected Date";
    case ValueErrorType.Function:
      return "Expected function";
    case ValueErrorType.IntegerExclusiveMaximum:
      return `Expected integer to be less than ${error2.schema.exclusiveMaximum}`;
    case ValueErrorType.IntegerExclusiveMinimum:
      return `Expected integer to be greater than ${error2.schema.exclusiveMinimum}`;
    case ValueErrorType.IntegerMaximum:
      return `Expected integer to be less or equal to ${error2.schema.maximum}`;
    case ValueErrorType.IntegerMinimum:
      return `Expected integer to be greater or equal to ${error2.schema.minimum}`;
    case ValueErrorType.IntegerMultipleOf:
      return `Expected integer to be a multiple of ${error2.schema.multipleOf}`;
    case ValueErrorType.Integer:
      return "Expected integer";
    case ValueErrorType.IntersectUnevaluatedProperties:
      return "Unexpected property";
    case ValueErrorType.Intersect:
      return "Expected all values to match";
    case ValueErrorType.Iterator:
      return "Expected Iterator";
    case ValueErrorType.Literal:
      return `Expected ${typeof error2.schema.const === "string" ? `'${error2.schema.const}'` : error2.schema.const}`;
    case ValueErrorType.Never:
      return "Never";
    case ValueErrorType.Not:
      return "Value should not match";
    case ValueErrorType.Null:
      return "Expected null";
    case ValueErrorType.NumberExclusiveMaximum:
      return `Expected number to be less than ${error2.schema.exclusiveMaximum}`;
    case ValueErrorType.NumberExclusiveMinimum:
      return `Expected number to be greater than ${error2.schema.exclusiveMinimum}`;
    case ValueErrorType.NumberMaximum:
      return `Expected number to be less or equal to ${error2.schema.maximum}`;
    case ValueErrorType.NumberMinimum:
      return `Expected number to be greater or equal to ${error2.schema.minimum}`;
    case ValueErrorType.NumberMultipleOf:
      return `Expected number to be a multiple of ${error2.schema.multipleOf}`;
    case ValueErrorType.Number:
      return "Expected number";
    case ValueErrorType.Object:
      return "Expected object";
    case ValueErrorType.ObjectAdditionalProperties:
      return "Unexpected property";
    case ValueErrorType.ObjectMaxProperties:
      return `Expected object to have no more than ${error2.schema.maxProperties} properties`;
    case ValueErrorType.ObjectMinProperties:
      return `Expected object to have at least ${error2.schema.minProperties} properties`;
    case ValueErrorType.ObjectRequiredProperty:
      return "Expected required property";
    case ValueErrorType.Promise:
      return "Expected Promise";
    case ValueErrorType.RegExp:
      return "Expected string to match regular expression";
    case ValueErrorType.StringFormatUnknown:
      return `Unknown format '${error2.schema.format}'`;
    case ValueErrorType.StringFormat:
      return `Expected string to match '${error2.schema.format}' format`;
    case ValueErrorType.StringMaxLength:
      return `Expected string length less or equal to ${error2.schema.maxLength}`;
    case ValueErrorType.StringMinLength:
      return `Expected string length greater or equal to ${error2.schema.minLength}`;
    case ValueErrorType.StringPattern:
      return `Expected string to match '${error2.schema.pattern}'`;
    case ValueErrorType.String:
      return "Expected string";
    case ValueErrorType.Symbol:
      return "Expected symbol";
    case ValueErrorType.TupleLength:
      return `Expected tuple to have ${error2.schema.maxItems || 0} elements`;
    case ValueErrorType.Tuple:
      return "Expected tuple";
    case ValueErrorType.Uint8ArrayMaxByteLength:
      return `Expected byte length less or equal to ${error2.schema.maxByteLength}`;
    case ValueErrorType.Uint8ArrayMinByteLength:
      return `Expected byte length greater or equal to ${error2.schema.minByteLength}`;
    case ValueErrorType.Uint8Array:
      return "Expected Uint8Array";
    case ValueErrorType.Undefined:
      return "Expected undefined";
    case ValueErrorType.Union:
      return "Expected union value";
    case ValueErrorType.Void:
      return "Expected void";
    case ValueErrorType.Kind:
      return `Expected kind '${error2.schema[Kind]}'`;
    default:
      return "Unknown error type";
  }
}
function GetErrorFunction() {
  return errorFunction;
}
var errorFunction;
var init_function3 = __esm(() => {
  init_symbols2();
  init_errors();
  errorFunction = DefaultErrorFunction;
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/deref/deref.mjs
function Resolve(schema, references) {
  const target = references.find((target2) => target2.$id === schema.$ref);
  if (target === undefined)
    throw new TypeDereferenceError(schema);
  return Deref(target, references);
}
function Pushref(schema, references) {
  if (!IsString(schema.$id) || references.some((target) => target.$id === schema.$id))
    return references;
  references.push(schema);
  return references;
}
function Deref(schema, references) {
  return schema[Kind] === "This" || schema[Kind] === "Ref" ? Resolve(schema, references) : schema;
}
var TypeDereferenceError;
var init_deref = __esm(() => {
  init_error2();
  init_symbols2();
  TypeDereferenceError = class TypeDereferenceError extends TypeBoxError {
    constructor(schema) {
      super(`Unable to dereference schema with $id '${schema.$ref}'`);
      this.schema = schema;
    }
  };
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/deref/index.mjs
var init_deref2 = __esm(() => {
  init_deref();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/hash/hash.mjs
function* NumberToBytes(value) {
  const byteCount = value === 0 ? 1 : Math.ceil(Math.floor(Math.log2(value) + 1) / 8);
  for (let i = 0;i < byteCount; i++) {
    yield value >> 8 * (byteCount - 1 - i) & 255;
  }
}
function ArrayType2(value) {
  FNV1A64(ByteMarker.Array);
  for (const item of value) {
    Visit3(item);
  }
}
function BooleanType(value) {
  FNV1A64(ByteMarker.Boolean);
  FNV1A64(value ? 1 : 0);
}
function BigIntType(value) {
  FNV1A64(ByteMarker.BigInt);
  F64In.setBigInt64(0, value);
  for (const byte of F64Out) {
    FNV1A64(byte);
  }
}
function DateType2(value) {
  FNV1A64(ByteMarker.Date);
  Visit3(value.getTime());
}
function NullType(value) {
  FNV1A64(ByteMarker.Null);
}
function NumberType(value) {
  FNV1A64(ByteMarker.Number);
  F64In.setFloat64(0, value);
  for (const byte of F64Out) {
    FNV1A64(byte);
  }
}
function ObjectType2(value) {
  FNV1A64(ByteMarker.Object);
  for (const key of globalThis.Object.getOwnPropertyNames(value).sort()) {
    Visit3(key);
    Visit3(value[key]);
  }
}
function StringType(value) {
  FNV1A64(ByteMarker.String);
  for (let i = 0;i < value.length; i++) {
    for (const byte of NumberToBytes(value.charCodeAt(i))) {
      FNV1A64(byte);
    }
  }
}
function SymbolType(value) {
  FNV1A64(ByteMarker.Symbol);
  Visit3(value.description);
}
function Uint8ArrayType2(value) {
  FNV1A64(ByteMarker.Uint8Array);
  for (let i = 0;i < value.length; i++) {
    FNV1A64(value[i]);
  }
}
function UndefinedType(value) {
  return FNV1A64(ByteMarker.Undefined);
}
function Visit3(value) {
  if (IsArray(value))
    return ArrayType2(value);
  if (IsBoolean(value))
    return BooleanType(value);
  if (IsBigInt(value))
    return BigIntType(value);
  if (IsDate(value))
    return DateType2(value);
  if (IsNull(value))
    return NullType(value);
  if (IsNumber(value))
    return NumberType(value);
  if (IsObject(value))
    return ObjectType2(value);
  if (IsString(value))
    return StringType(value);
  if (IsSymbol(value))
    return SymbolType(value);
  if (IsUint8Array(value))
    return Uint8ArrayType2(value);
  if (IsUndefined(value))
    return UndefinedType(value);
  throw new ValueHashError(value);
}
function FNV1A64(byte) {
  Accumulator = Accumulator ^ Bytes[byte];
  Accumulator = Accumulator * Prime % Size;
}
function Hash(value) {
  Accumulator = BigInt("14695981039346656037");
  Visit3(value);
  return Accumulator;
}
var ValueHashError, ByteMarker, Accumulator, Prime, Size, Bytes, F64, F64In, F64Out;
var init_hash = __esm(() => {
  init_guard();
  init_error2();
  ValueHashError = class ValueHashError extends TypeBoxError {
    constructor(value) {
      super(`Unable to hash value`);
      this.value = value;
    }
  };
  (function(ByteMarker2) {
    ByteMarker2[ByteMarker2["Undefined"] = 0] = "Undefined";
    ByteMarker2[ByteMarker2["Null"] = 1] = "Null";
    ByteMarker2[ByteMarker2["Boolean"] = 2] = "Boolean";
    ByteMarker2[ByteMarker2["Number"] = 3] = "Number";
    ByteMarker2[ByteMarker2["String"] = 4] = "String";
    ByteMarker2[ByteMarker2["Object"] = 5] = "Object";
    ByteMarker2[ByteMarker2["Array"] = 6] = "Array";
    ByteMarker2[ByteMarker2["Date"] = 7] = "Date";
    ByteMarker2[ByteMarker2["Uint8Array"] = 8] = "Uint8Array";
    ByteMarker2[ByteMarker2["Symbol"] = 9] = "Symbol";
    ByteMarker2[ByteMarker2["BigInt"] = 10] = "BigInt";
  })(ByteMarker || (ByteMarker = {}));
  Accumulator = BigInt("14695981039346656037");
  [Prime, Size] = [BigInt("1099511628211"), BigInt("18446744073709551616")];
  Bytes = Array.from({ length: 256 }).map((_, i) => BigInt(i));
  F64 = new Float64Array(1);
  F64In = new DataView(F64.buffer);
  F64Out = new Uint8Array(F64.buffer);
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/hash/index.mjs
var init_hash2 = __esm(() => {
  init_hash();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/any/any.mjs
function Any(options) {
  return CreateType({ [Kind]: "Any" }, options);
}
var init_any = __esm(() => {
  init_create();
  init_symbols2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/any/index.mjs
var init_any2 = __esm(() => {
  init_any();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/unknown/unknown.mjs
function Unknown(options) {
  return CreateType({ [Kind]: "Unknown" }, options);
}
var init_unknown = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/unknown/index.mjs
var init_unknown2 = __esm(() => {
  init_unknown();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/guard/type.mjs
var exports_type2 = {};
__export(exports_type2, {
  TypeGuardUnknownTypeError: () => TypeGuardUnknownTypeError,
  IsVoid: () => IsVoid2,
  IsUnsafe: () => IsUnsafe2,
  IsUnknown: () => IsUnknown2,
  IsUnionLiteral: () => IsUnionLiteral,
  IsUnion: () => IsUnion2,
  IsUndefined: () => IsUndefined4,
  IsUint8Array: () => IsUint8Array4,
  IsTuple: () => IsTuple2,
  IsTransform: () => IsTransform2,
  IsThis: () => IsThis2,
  IsTemplateLiteral: () => IsTemplateLiteral2,
  IsSymbol: () => IsSymbol4,
  IsString: () => IsString4,
  IsSchema: () => IsSchema2,
  IsRegExp: () => IsRegExp3,
  IsRef: () => IsRef2,
  IsRecursive: () => IsRecursive,
  IsRecord: () => IsRecord2,
  IsReadonly: () => IsReadonly2,
  IsProperties: () => IsProperties,
  IsPromise: () => IsPromise3,
  IsOptional: () => IsOptional2,
  IsObject: () => IsObject4,
  IsNumber: () => IsNumber4,
  IsNull: () => IsNull4,
  IsNot: () => IsNot2,
  IsNever: () => IsNever2,
  IsMappedResult: () => IsMappedResult2,
  IsMappedKey: () => IsMappedKey2,
  IsLiteralValue: () => IsLiteralValue2,
  IsLiteralString: () => IsLiteralString,
  IsLiteralNumber: () => IsLiteralNumber,
  IsLiteralBoolean: () => IsLiteralBoolean,
  IsLiteral: () => IsLiteral2,
  IsKindOf: () => IsKindOf2,
  IsKind: () => IsKind2,
  IsIterator: () => IsIterator4,
  IsIntersect: () => IsIntersect2,
  IsInteger: () => IsInteger3,
  IsImport: () => IsImport,
  IsFunction: () => IsFunction4,
  IsDate: () => IsDate4,
  IsConstructor: () => IsConstructor2,
  IsComputed: () => IsComputed2,
  IsBoolean: () => IsBoolean4,
  IsBigInt: () => IsBigInt4,
  IsAsyncIterator: () => IsAsyncIterator4,
  IsArray: () => IsArray4,
  IsArgument: () => IsArgument2,
  IsAny: () => IsAny2
});
function IsPattern(value) {
  try {
    new RegExp(value);
    return true;
  } catch {
    return false;
  }
}
function IsControlCharacterFree(value) {
  if (!IsString2(value))
    return false;
  for (let i = 0;i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code >= 7 && code <= 13 || code === 27 || code === 127) {
      return false;
    }
  }
  return true;
}
function IsAdditionalProperties(value) {
  return IsOptionalBoolean(value) || IsSchema2(value);
}
function IsOptionalBigInt(value) {
  return IsUndefined2(value) || IsBigInt2(value);
}
function IsOptionalNumber(value) {
  return IsUndefined2(value) || IsNumber2(value);
}
function IsOptionalBoolean(value) {
  return IsUndefined2(value) || IsBoolean2(value);
}
function IsOptionalString(value) {
  return IsUndefined2(value) || IsString2(value);
}
function IsOptionalPattern(value) {
  return IsUndefined2(value) || IsString2(value) && IsControlCharacterFree(value) && IsPattern(value);
}
function IsOptionalFormat(value) {
  return IsUndefined2(value) || IsString2(value) && IsControlCharacterFree(value);
}
function IsOptionalSchema(value) {
  return IsUndefined2(value) || IsSchema2(value);
}
function IsReadonly2(value) {
  return IsObject2(value) && value[ReadonlyKind] === "Readonly";
}
function IsOptional2(value) {
  return IsObject2(value) && value[OptionalKind] === "Optional";
}
function IsAny2(value) {
  return IsKindOf2(value, "Any") && IsOptionalString(value.$id);
}
function IsArgument2(value) {
  return IsKindOf2(value, "Argument") && IsNumber2(value.index);
}
function IsArray4(value) {
  return IsKindOf2(value, "Array") && value.type === "array" && IsOptionalString(value.$id) && IsSchema2(value.items) && IsOptionalNumber(value.minItems) && IsOptionalNumber(value.maxItems) && IsOptionalBoolean(value.uniqueItems) && IsOptionalSchema(value.contains) && IsOptionalNumber(value.minContains) && IsOptionalNumber(value.maxContains);
}
function IsAsyncIterator4(value) {
  return IsKindOf2(value, "AsyncIterator") && value.type === "AsyncIterator" && IsOptionalString(value.$id) && IsSchema2(value.items);
}
function IsBigInt4(value) {
  return IsKindOf2(value, "BigInt") && value.type === "bigint" && IsOptionalString(value.$id) && IsOptionalBigInt(value.exclusiveMaximum) && IsOptionalBigInt(value.exclusiveMinimum) && IsOptionalBigInt(value.maximum) && IsOptionalBigInt(value.minimum) && IsOptionalBigInt(value.multipleOf);
}
function IsBoolean4(value) {
  return IsKindOf2(value, "Boolean") && value.type === "boolean" && IsOptionalString(value.$id);
}
function IsComputed2(value) {
  return IsKindOf2(value, "Computed") && IsString2(value.target) && IsArray2(value.parameters) && value.parameters.every((schema) => IsSchema2(schema));
}
function IsConstructor2(value) {
  return IsKindOf2(value, "Constructor") && value.type === "Constructor" && IsOptionalString(value.$id) && IsArray2(value.parameters) && value.parameters.every((schema) => IsSchema2(schema)) && IsSchema2(value.returns);
}
function IsDate4(value) {
  return IsKindOf2(value, "Date") && value.type === "Date" && IsOptionalString(value.$id) && IsOptionalNumber(value.exclusiveMaximumTimestamp) && IsOptionalNumber(value.exclusiveMinimumTimestamp) && IsOptionalNumber(value.maximumTimestamp) && IsOptionalNumber(value.minimumTimestamp) && IsOptionalNumber(value.multipleOfTimestamp);
}
function IsFunction4(value) {
  return IsKindOf2(value, "Function") && value.type === "Function" && IsOptionalString(value.$id) && IsArray2(value.parameters) && value.parameters.every((schema) => IsSchema2(schema)) && IsSchema2(value.returns);
}
function IsImport(value) {
  return IsKindOf2(value, "Import") && HasPropertyKey2(value, "$defs") && IsObject2(value.$defs) && IsProperties(value.$defs) && HasPropertyKey2(value, "$ref") && IsString2(value.$ref) && value.$ref in value.$defs;
}
function IsInteger3(value) {
  return IsKindOf2(value, "Integer") && value.type === "integer" && IsOptionalString(value.$id) && IsOptionalNumber(value.exclusiveMaximum) && IsOptionalNumber(value.exclusiveMinimum) && IsOptionalNumber(value.maximum) && IsOptionalNumber(value.minimum) && IsOptionalNumber(value.multipleOf);
}
function IsProperties(value) {
  return IsObject2(value) && Object.entries(value).every(([key, schema]) => IsControlCharacterFree(key) && IsSchema2(schema));
}
function IsIntersect2(value) {
  return IsKindOf2(value, "Intersect") && (IsString2(value.type) && value.type !== "object" ? false : true) && IsArray2(value.allOf) && value.allOf.every((schema) => IsSchema2(schema) && !IsTransform2(schema)) && IsOptionalString(value.type) && (IsOptionalBoolean(value.unevaluatedProperties) || IsOptionalSchema(value.unevaluatedProperties)) && IsOptionalString(value.$id);
}
function IsIterator4(value) {
  return IsKindOf2(value, "Iterator") && value.type === "Iterator" && IsOptionalString(value.$id) && IsSchema2(value.items);
}
function IsKindOf2(value, kind) {
  return IsObject2(value) && Kind in value && value[Kind] === kind;
}
function IsLiteralString(value) {
  return IsLiteral2(value) && IsString2(value.const);
}
function IsLiteralNumber(value) {
  return IsLiteral2(value) && IsNumber2(value.const);
}
function IsLiteralBoolean(value) {
  return IsLiteral2(value) && IsBoolean2(value.const);
}
function IsLiteral2(value) {
  return IsKindOf2(value, "Literal") && IsOptionalString(value.$id) && IsLiteralValue2(value.const);
}
function IsLiteralValue2(value) {
  return IsBoolean2(value) || IsNumber2(value) || IsString2(value);
}
function IsMappedKey2(value) {
  return IsKindOf2(value, "MappedKey") && IsArray2(value.keys) && value.keys.every((key) => IsNumber2(key) || IsString2(key));
}
function IsMappedResult2(value) {
  return IsKindOf2(value, "MappedResult") && IsProperties(value.properties);
}
function IsNever2(value) {
  return IsKindOf2(value, "Never") && IsObject2(value.not) && Object.getOwnPropertyNames(value.not).length === 0;
}
function IsNot2(value) {
  return IsKindOf2(value, "Not") && IsSchema2(value.not);
}
function IsNull4(value) {
  return IsKindOf2(value, "Null") && value.type === "null" && IsOptionalString(value.$id);
}
function IsNumber4(value) {
  return IsKindOf2(value, "Number") && value.type === "number" && IsOptionalString(value.$id) && IsOptionalNumber(value.exclusiveMaximum) && IsOptionalNumber(value.exclusiveMinimum) && IsOptionalNumber(value.maximum) && IsOptionalNumber(value.minimum) && IsOptionalNumber(value.multipleOf);
}
function IsObject4(value) {
  return IsKindOf2(value, "Object") && value.type === "object" && IsOptionalString(value.$id) && IsProperties(value.properties) && IsAdditionalProperties(value.additionalProperties) && IsOptionalNumber(value.minProperties) && IsOptionalNumber(value.maxProperties);
}
function IsPromise3(value) {
  return IsKindOf2(value, "Promise") && value.type === "Promise" && IsOptionalString(value.$id) && IsSchema2(value.item);
}
function IsRecord2(value) {
  return IsKindOf2(value, "Record") && value.type === "object" && IsOptionalString(value.$id) && IsAdditionalProperties(value.additionalProperties) && IsObject2(value.patternProperties) && ((schema) => {
    const keys = Object.getOwnPropertyNames(schema.patternProperties);
    return keys.length === 1 && IsPattern(keys[0]) && IsObject2(schema.patternProperties) && IsSchema2(schema.patternProperties[keys[0]]);
  })(value);
}
function IsRecursive(value) {
  return IsObject2(value) && Hint in value && value[Hint] === "Recursive";
}
function IsRef2(value) {
  return IsKindOf2(value, "Ref") && IsOptionalString(value.$id) && IsString2(value.$ref);
}
function IsRegExp3(value) {
  return IsKindOf2(value, "RegExp") && IsOptionalString(value.$id) && IsString2(value.source) && IsString2(value.flags) && IsOptionalNumber(value.maxLength) && IsOptionalNumber(value.minLength);
}
function IsString4(value) {
  return IsKindOf2(value, "String") && value.type === "string" && IsOptionalString(value.$id) && IsOptionalNumber(value.minLength) && IsOptionalNumber(value.maxLength) && IsOptionalPattern(value.pattern) && IsOptionalFormat(value.format);
}
function IsSymbol4(value) {
  return IsKindOf2(value, "Symbol") && value.type === "symbol" && IsOptionalString(value.$id);
}
function IsTemplateLiteral2(value) {
  return IsKindOf2(value, "TemplateLiteral") && value.type === "string" && IsString2(value.pattern) && value.pattern[0] === "^" && value.pattern[value.pattern.length - 1] === "$";
}
function IsThis2(value) {
  return IsKindOf2(value, "This") && IsOptionalString(value.$id) && IsString2(value.$ref);
}
function IsTransform2(value) {
  return IsObject2(value) && TransformKind in value;
}
function IsTuple2(value) {
  return IsKindOf2(value, "Tuple") && value.type === "array" && IsOptionalString(value.$id) && IsNumber2(value.minItems) && IsNumber2(value.maxItems) && value.minItems === value.maxItems && (IsUndefined2(value.items) && IsUndefined2(value.additionalItems) && value.minItems === 0 || IsArray2(value.items) && value.items.every((schema) => IsSchema2(schema)));
}
function IsUndefined4(value) {
  return IsKindOf2(value, "Undefined") && value.type === "undefined" && IsOptionalString(value.$id);
}
function IsUnionLiteral(value) {
  return IsUnion2(value) && value.anyOf.every((schema) => IsLiteralString(schema) || IsLiteralNumber(schema));
}
function IsUnion2(value) {
  return IsKindOf2(value, "Union") && IsOptionalString(value.$id) && IsObject2(value) && IsArray2(value.anyOf) && value.anyOf.every((schema) => IsSchema2(schema));
}
function IsUint8Array4(value) {
  return IsKindOf2(value, "Uint8Array") && value.type === "Uint8Array" && IsOptionalString(value.$id) && IsOptionalNumber(value.minByteLength) && IsOptionalNumber(value.maxByteLength);
}
function IsUnknown2(value) {
  return IsKindOf2(value, "Unknown") && IsOptionalString(value.$id);
}
function IsUnsafe2(value) {
  return IsKindOf2(value, "Unsafe");
}
function IsVoid2(value) {
  return IsKindOf2(value, "Void") && value.type === "void" && IsOptionalString(value.$id);
}
function IsKind2(value) {
  return IsObject2(value) && Kind in value && IsString2(value[Kind]) && !KnownTypes.includes(value[Kind]);
}
function IsSchema2(value) {
  return IsObject2(value) && (IsAny2(value) || IsArgument2(value) || IsArray4(value) || IsBoolean4(value) || IsBigInt4(value) || IsAsyncIterator4(value) || IsComputed2(value) || IsConstructor2(value) || IsDate4(value) || IsFunction4(value) || IsInteger3(value) || IsIntersect2(value) || IsIterator4(value) || IsLiteral2(value) || IsMappedKey2(value) || IsMappedResult2(value) || IsNever2(value) || IsNot2(value) || IsNull4(value) || IsNumber4(value) || IsObject4(value) || IsPromise3(value) || IsRecord2(value) || IsRef2(value) || IsRegExp3(value) || IsString4(value) || IsSymbol4(value) || IsTemplateLiteral2(value) || IsThis2(value) || IsTuple2(value) || IsUndefined4(value) || IsUnion2(value) || IsUint8Array4(value) || IsUnknown2(value) || IsUnsafe2(value) || IsVoid2(value) || IsKind2(value));
}
var TypeGuardUnknownTypeError, KnownTypes;
var init_type3 = __esm(() => {
  init_symbols2();
  init_error2();
  TypeGuardUnknownTypeError = class TypeGuardUnknownTypeError extends TypeBoxError {
  };
  KnownTypes = [
    "Argument",
    "Any",
    "Array",
    "AsyncIterator",
    "BigInt",
    "Boolean",
    "Computed",
    "Constructor",
    "Date",
    "Enum",
    "Function",
    "Integer",
    "Intersect",
    "Iterator",
    "Literal",
    "MappedKey",
    "MappedResult",
    "Not",
    "Null",
    "Number",
    "Object",
    "Promise",
    "Record",
    "Ref",
    "RegExp",
    "String",
    "Symbol",
    "TemplateLiteral",
    "This",
    "Tuple",
    "Undefined",
    "Union",
    "Uint8Array",
    "Unknown",
    "Void"
  ];
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/guard/index.mjs
var init_guard2 = __esm(() => {
  init_kind();
  init_type3();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/extends/extends-check.mjs
function IntoBooleanResult(result) {
  return result === ExtendsResult.False ? result : ExtendsResult.True;
}
function Throw(message2) {
  throw new ExtendsResolverError(message2);
}
function IsStructuralRight(right) {
  return exports_type2.IsNever(right) || exports_type2.IsIntersect(right) || exports_type2.IsUnion(right) || exports_type2.IsUnknown(right) || exports_type2.IsAny(right);
}
function StructuralRight(left, right) {
  return exports_type2.IsNever(right) ? FromNeverRight(left, right) : exports_type2.IsIntersect(right) ? FromIntersectRight(left, right) : exports_type2.IsUnion(right) ? FromUnionRight(left, right) : exports_type2.IsUnknown(right) ? FromUnknownRight(left, right) : exports_type2.IsAny(right) ? FromAnyRight(left, right) : Throw("StructuralRight");
}
function FromAnyRight(left, right) {
  return ExtendsResult.True;
}
function FromAny(left, right) {
  return exports_type2.IsIntersect(right) ? FromIntersectRight(left, right) : exports_type2.IsUnion(right) && right.anyOf.some((schema) => exports_type2.IsAny(schema) || exports_type2.IsUnknown(schema)) ? ExtendsResult.True : exports_type2.IsUnion(right) ? ExtendsResult.Union : exports_type2.IsUnknown(right) ? ExtendsResult.True : exports_type2.IsAny(right) ? ExtendsResult.True : ExtendsResult.Union;
}
function FromArrayRight(left, right) {
  return exports_type2.IsUnknown(left) ? ExtendsResult.False : exports_type2.IsAny(left) ? ExtendsResult.Union : exports_type2.IsNever(left) ? ExtendsResult.True : ExtendsResult.False;
}
function FromArray3(left, right) {
  return exports_type2.IsObject(right) && IsObjectArrayLike(right) ? ExtendsResult.True : IsStructuralRight(right) ? StructuralRight(left, right) : !exports_type2.IsArray(right) ? ExtendsResult.False : IntoBooleanResult(Visit4(left.items, right.items));
}
function FromAsyncIterator(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : !exports_type2.IsAsyncIterator(right) ? ExtendsResult.False : IntoBooleanResult(Visit4(left.items, right.items));
}
function FromBigInt(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type2.IsObject(right) ? FromObjectRight(left, right) : exports_type2.IsRecord(right) ? FromRecordRight(left, right) : exports_type2.IsBigInt(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromBooleanRight(left, right) {
  return exports_type2.IsLiteralBoolean(left) ? ExtendsResult.True : exports_type2.IsBoolean(left) ? ExtendsResult.True : ExtendsResult.False;
}
function FromBoolean(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type2.IsObject(right) ? FromObjectRight(left, right) : exports_type2.IsRecord(right) ? FromRecordRight(left, right) : exports_type2.IsBoolean(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromConstructor(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type2.IsObject(right) ? FromObjectRight(left, right) : !exports_type2.IsConstructor(right) ? ExtendsResult.False : left.parameters.length > right.parameters.length ? ExtendsResult.False : !left.parameters.every((schema, index) => IntoBooleanResult(Visit4(right.parameters[index], schema)) === ExtendsResult.True) ? ExtendsResult.False : IntoBooleanResult(Visit4(left.returns, right.returns));
}
function FromDate(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type2.IsObject(right) ? FromObjectRight(left, right) : exports_type2.IsRecord(right) ? FromRecordRight(left, right) : exports_type2.IsDate(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromFunction(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type2.IsObject(right) ? FromObjectRight(left, right) : !exports_type2.IsFunction(right) ? ExtendsResult.False : left.parameters.length > right.parameters.length ? ExtendsResult.False : !left.parameters.every((schema, index) => IntoBooleanResult(Visit4(right.parameters[index], schema)) === ExtendsResult.True) ? ExtendsResult.False : IntoBooleanResult(Visit4(left.returns, right.returns));
}
function FromIntegerRight(left, right) {
  return exports_type2.IsLiteral(left) && exports_value.IsNumber(left.const) ? ExtendsResult.True : exports_type2.IsNumber(left) || exports_type2.IsInteger(left) ? ExtendsResult.True : ExtendsResult.False;
}
function FromInteger(left, right) {
  return exports_type2.IsInteger(right) || exports_type2.IsNumber(right) ? ExtendsResult.True : IsStructuralRight(right) ? StructuralRight(left, right) : exports_type2.IsObject(right) ? FromObjectRight(left, right) : exports_type2.IsRecord(right) ? FromRecordRight(left, right) : ExtendsResult.False;
}
function FromIntersectRight(left, right) {
  return right.allOf.every((schema) => Visit4(left, schema) === ExtendsResult.True) ? ExtendsResult.True : ExtendsResult.False;
}
function FromIntersect3(left, right) {
  return left.allOf.some((schema) => Visit4(schema, right) === ExtendsResult.True) ? ExtendsResult.True : ExtendsResult.False;
}
function FromIterator(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : !exports_type2.IsIterator(right) ? ExtendsResult.False : IntoBooleanResult(Visit4(left.items, right.items));
}
function FromLiteral2(left, right) {
  return exports_type2.IsLiteral(right) && right.const === left.const ? ExtendsResult.True : IsStructuralRight(right) ? StructuralRight(left, right) : exports_type2.IsObject(right) ? FromObjectRight(left, right) : exports_type2.IsRecord(right) ? FromRecordRight(left, right) : exports_type2.IsString(right) ? FromStringRight(left, right) : exports_type2.IsNumber(right) ? FromNumberRight(left, right) : exports_type2.IsInteger(right) ? FromIntegerRight(left, right) : exports_type2.IsBoolean(right) ? FromBooleanRight(left, right) : ExtendsResult.False;
}
function FromNeverRight(left, right) {
  return ExtendsResult.False;
}
function FromNever(left, right) {
  return ExtendsResult.True;
}
function UnwrapTNot(schema) {
  let [current, depth] = [schema, 0];
  while (true) {
    if (!exports_type2.IsNot(current))
      break;
    current = current.not;
    depth += 1;
  }
  return depth % 2 === 0 ? current : Unknown();
}
function FromNot(left, right) {
  return exports_type2.IsNot(left) ? Visit4(UnwrapTNot(left), right) : exports_type2.IsNot(right) ? Visit4(left, UnwrapTNot(right)) : Throw("Invalid fallthrough for Not");
}
function FromNull(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type2.IsObject(right) ? FromObjectRight(left, right) : exports_type2.IsRecord(right) ? FromRecordRight(left, right) : exports_type2.IsNull(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromNumberRight(left, right) {
  return exports_type2.IsLiteralNumber(left) ? ExtendsResult.True : exports_type2.IsNumber(left) || exports_type2.IsInteger(left) ? ExtendsResult.True : ExtendsResult.False;
}
function FromNumber(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type2.IsObject(right) ? FromObjectRight(left, right) : exports_type2.IsRecord(right) ? FromRecordRight(left, right) : exports_type2.IsInteger(right) || exports_type2.IsNumber(right) ? ExtendsResult.True : ExtendsResult.False;
}
function IsObjectPropertyCount(schema, count) {
  return Object.getOwnPropertyNames(schema.properties).length === count;
}
function IsObjectStringLike(schema) {
  return IsObjectArrayLike(schema);
}
function IsObjectSymbolLike(schema) {
  return IsObjectPropertyCount(schema, 0) || IsObjectPropertyCount(schema, 1) && "description" in schema.properties && exports_type2.IsUnion(schema.properties.description) && schema.properties.description.anyOf.length === 2 && (exports_type2.IsString(schema.properties.description.anyOf[0]) && exports_type2.IsUndefined(schema.properties.description.anyOf[1]) || exports_type2.IsString(schema.properties.description.anyOf[1]) && exports_type2.IsUndefined(schema.properties.description.anyOf[0]));
}
function IsObjectNumberLike(schema) {
  return IsObjectPropertyCount(schema, 0);
}
function IsObjectBooleanLike(schema) {
  return IsObjectPropertyCount(schema, 0);
}
function IsObjectBigIntLike(schema) {
  return IsObjectPropertyCount(schema, 0);
}
function IsObjectDateLike(schema) {
  return IsObjectPropertyCount(schema, 0);
}
function IsObjectUint8ArrayLike(schema) {
  return IsObjectArrayLike(schema);
}
function IsObjectFunctionLike(schema) {
  const length = Number2();
  return IsObjectPropertyCount(schema, 0) || IsObjectPropertyCount(schema, 1) && "length" in schema.properties && IntoBooleanResult(Visit4(schema.properties["length"], length)) === ExtendsResult.True;
}
function IsObjectConstructorLike(schema) {
  return IsObjectPropertyCount(schema, 0);
}
function IsObjectArrayLike(schema) {
  const length = Number2();
  return IsObjectPropertyCount(schema, 0) || IsObjectPropertyCount(schema, 1) && "length" in schema.properties && IntoBooleanResult(Visit4(schema.properties["length"], length)) === ExtendsResult.True;
}
function IsObjectPromiseLike(schema) {
  const then = Function2([Any()], Any());
  return IsObjectPropertyCount(schema, 0) || IsObjectPropertyCount(schema, 1) && "then" in schema.properties && IntoBooleanResult(Visit4(schema.properties["then"], then)) === ExtendsResult.True;
}
function Property(left, right) {
  return Visit4(left, right) === ExtendsResult.False ? ExtendsResult.False : exports_type2.IsOptional(left) && !exports_type2.IsOptional(right) ? ExtendsResult.False : ExtendsResult.True;
}
function FromObjectRight(left, right) {
  return exports_type2.IsUnknown(left) ? ExtendsResult.False : exports_type2.IsAny(left) ? ExtendsResult.Union : exports_type2.IsNever(left) || exports_type2.IsLiteralString(left) && IsObjectStringLike(right) || exports_type2.IsLiteralNumber(left) && IsObjectNumberLike(right) || exports_type2.IsLiteralBoolean(left) && IsObjectBooleanLike(right) || exports_type2.IsSymbol(left) && IsObjectSymbolLike(right) || exports_type2.IsBigInt(left) && IsObjectBigIntLike(right) || exports_type2.IsString(left) && IsObjectStringLike(right) || exports_type2.IsSymbol(left) && IsObjectSymbolLike(right) || exports_type2.IsNumber(left) && IsObjectNumberLike(right) || exports_type2.IsInteger(left) && IsObjectNumberLike(right) || exports_type2.IsBoolean(left) && IsObjectBooleanLike(right) || exports_type2.IsUint8Array(left) && IsObjectUint8ArrayLike(right) || exports_type2.IsDate(left) && IsObjectDateLike(right) || exports_type2.IsConstructor(left) && IsObjectConstructorLike(right) || exports_type2.IsFunction(left) && IsObjectFunctionLike(right) ? ExtendsResult.True : exports_type2.IsRecord(left) && exports_type2.IsString(RecordKey(left)) ? (() => {
    return right[Hint] === "Record" ? ExtendsResult.True : ExtendsResult.False;
  })() : exports_type2.IsRecord(left) && exports_type2.IsNumber(RecordKey(left)) ? (() => {
    return IsObjectPropertyCount(right, 0) ? ExtendsResult.True : ExtendsResult.False;
  })() : ExtendsResult.False;
}
function FromObject(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type2.IsRecord(right) ? FromRecordRight(left, right) : !exports_type2.IsObject(right) ? ExtendsResult.False : (() => {
    for (const key of Object.getOwnPropertyNames(right.properties)) {
      if (!(key in left.properties) && !exports_type2.IsOptional(right.properties[key])) {
        return ExtendsResult.False;
      }
      if (exports_type2.IsOptional(right.properties[key])) {
        return ExtendsResult.True;
      }
      if (Property(left.properties[key], right.properties[key]) === ExtendsResult.False) {
        return ExtendsResult.False;
      }
    }
    return ExtendsResult.True;
  })();
}
function FromPromise(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type2.IsObject(right) && IsObjectPromiseLike(right) ? ExtendsResult.True : !exports_type2.IsPromise(right) ? ExtendsResult.False : IntoBooleanResult(Visit4(left.item, right.item));
}
function RecordKey(schema) {
  return PatternNumberExact in schema.patternProperties ? Number2() : (PatternStringExact in schema.patternProperties) ? String2() : Throw("Unknown record key pattern");
}
function RecordValue(schema) {
  return PatternNumberExact in schema.patternProperties ? schema.patternProperties[PatternNumberExact] : (PatternStringExact in schema.patternProperties) ? schema.patternProperties[PatternStringExact] : Throw("Unable to get record value schema");
}
function FromRecordRight(left, right) {
  const [Key, Value] = [RecordKey(right), RecordValue(right)];
  return exports_type2.IsLiteralString(left) && exports_type2.IsNumber(Key) && IntoBooleanResult(Visit4(left, Value)) === ExtendsResult.True ? ExtendsResult.True : exports_type2.IsUint8Array(left) && exports_type2.IsNumber(Key) ? Visit4(left, Value) : exports_type2.IsString(left) && exports_type2.IsNumber(Key) ? Visit4(left, Value) : exports_type2.IsArray(left) && exports_type2.IsNumber(Key) ? Visit4(left, Value) : exports_type2.IsObject(left) ? (() => {
    for (const key of Object.getOwnPropertyNames(left.properties)) {
      if (Property(Value, left.properties[key]) === ExtendsResult.False) {
        return ExtendsResult.False;
      }
    }
    return ExtendsResult.True;
  })() : ExtendsResult.False;
}
function FromRecord(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type2.IsObject(right) ? FromObjectRight(left, right) : !exports_type2.IsRecord(right) ? ExtendsResult.False : Visit4(RecordValue(left), RecordValue(right));
}
function FromRegExp(left, right) {
  const L = exports_type2.IsRegExp(left) ? String2() : left;
  const R = exports_type2.IsRegExp(right) ? String2() : right;
  return Visit4(L, R);
}
function FromStringRight(left, right) {
  return exports_type2.IsLiteral(left) && exports_value.IsString(left.const) ? ExtendsResult.True : exports_type2.IsString(left) ? ExtendsResult.True : ExtendsResult.False;
}
function FromString(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type2.IsObject(right) ? FromObjectRight(left, right) : exports_type2.IsRecord(right) ? FromRecordRight(left, right) : exports_type2.IsString(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromSymbol(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type2.IsObject(right) ? FromObjectRight(left, right) : exports_type2.IsRecord(right) ? FromRecordRight(left, right) : exports_type2.IsSymbol(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromTemplateLiteral2(left, right) {
  return exports_type2.IsTemplateLiteral(left) ? Visit4(TemplateLiteralToUnion(left), right) : exports_type2.IsTemplateLiteral(right) ? Visit4(left, TemplateLiteralToUnion(right)) : Throw("Invalid fallthrough for TemplateLiteral");
}
function IsArrayOfTuple(left, right) {
  return exports_type2.IsArray(right) && left.items !== undefined && left.items.every((schema) => Visit4(schema, right.items) === ExtendsResult.True);
}
function FromTupleRight(left, right) {
  return exports_type2.IsNever(left) ? ExtendsResult.True : exports_type2.IsUnknown(left) ? ExtendsResult.False : exports_type2.IsAny(left) ? ExtendsResult.Union : ExtendsResult.False;
}
function FromTuple3(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type2.IsObject(right) && IsObjectArrayLike(right) ? ExtendsResult.True : exports_type2.IsArray(right) && IsArrayOfTuple(left, right) ? ExtendsResult.True : !exports_type2.IsTuple(right) ? ExtendsResult.False : exports_value.IsUndefined(left.items) && !exports_value.IsUndefined(right.items) || !exports_value.IsUndefined(left.items) && exports_value.IsUndefined(right.items) ? ExtendsResult.False : exports_value.IsUndefined(left.items) && !exports_value.IsUndefined(right.items) ? ExtendsResult.True : left.items.every((schema, index) => Visit4(schema, right.items[index]) === ExtendsResult.True) ? ExtendsResult.True : ExtendsResult.False;
}
function FromUint8Array(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type2.IsObject(right) ? FromObjectRight(left, right) : exports_type2.IsRecord(right) ? FromRecordRight(left, right) : exports_type2.IsUint8Array(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromUndefined(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : exports_type2.IsObject(right) ? FromObjectRight(left, right) : exports_type2.IsRecord(right) ? FromRecordRight(left, right) : exports_type2.IsVoid(right) ? FromVoidRight(left, right) : exports_type2.IsUndefined(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromUnionRight(left, right) {
  return right.anyOf.some((schema) => Visit4(left, schema) === ExtendsResult.True) ? ExtendsResult.True : ExtendsResult.False;
}
function FromUnion5(left, right) {
  return left.anyOf.every((schema) => Visit4(schema, right) === ExtendsResult.True) ? ExtendsResult.True : ExtendsResult.False;
}
function FromUnknownRight(left, right) {
  return ExtendsResult.True;
}
function FromUnknown(left, right) {
  return exports_type2.IsNever(right) ? FromNeverRight(left, right) : exports_type2.IsIntersect(right) ? FromIntersectRight(left, right) : exports_type2.IsUnion(right) ? FromUnionRight(left, right) : exports_type2.IsAny(right) ? FromAnyRight(left, right) : exports_type2.IsString(right) ? FromStringRight(left, right) : exports_type2.IsNumber(right) ? FromNumberRight(left, right) : exports_type2.IsInteger(right) ? FromIntegerRight(left, right) : exports_type2.IsBoolean(right) ? FromBooleanRight(left, right) : exports_type2.IsArray(right) ? FromArrayRight(left, right) : exports_type2.IsTuple(right) ? FromTupleRight(left, right) : exports_type2.IsObject(right) ? FromObjectRight(left, right) : exports_type2.IsUnknown(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromVoidRight(left, right) {
  return exports_type2.IsUndefined(left) ? ExtendsResult.True : exports_type2.IsUndefined(left) ? ExtendsResult.True : ExtendsResult.False;
}
function FromVoid(left, right) {
  return exports_type2.IsIntersect(right) ? FromIntersectRight(left, right) : exports_type2.IsUnion(right) ? FromUnionRight(left, right) : exports_type2.IsUnknown(right) ? FromUnknownRight(left, right) : exports_type2.IsAny(right) ? FromAnyRight(left, right) : exports_type2.IsObject(right) ? FromObjectRight(left, right) : exports_type2.IsVoid(right) ? ExtendsResult.True : ExtendsResult.False;
}
function Visit4(left, right) {
  return exports_type2.IsTemplateLiteral(left) || exports_type2.IsTemplateLiteral(right) ? FromTemplateLiteral2(left, right) : exports_type2.IsRegExp(left) || exports_type2.IsRegExp(right) ? FromRegExp(left, right) : exports_type2.IsNot(left) || exports_type2.IsNot(right) ? FromNot(left, right) : exports_type2.IsAny(left) ? FromAny(left, right) : exports_type2.IsArray(left) ? FromArray3(left, right) : exports_type2.IsBigInt(left) ? FromBigInt(left, right) : exports_type2.IsBoolean(left) ? FromBoolean(left, right) : exports_type2.IsAsyncIterator(left) ? FromAsyncIterator(left, right) : exports_type2.IsConstructor(left) ? FromConstructor(left, right) : exports_type2.IsDate(left) ? FromDate(left, right) : exports_type2.IsFunction(left) ? FromFunction(left, right) : exports_type2.IsInteger(left) ? FromInteger(left, right) : exports_type2.IsIntersect(left) ? FromIntersect3(left, right) : exports_type2.IsIterator(left) ? FromIterator(left, right) : exports_type2.IsLiteral(left) ? FromLiteral2(left, right) : exports_type2.IsNever(left) ? FromNever(left, right) : exports_type2.IsNull(left) ? FromNull(left, right) : exports_type2.IsNumber(left) ? FromNumber(left, right) : exports_type2.IsObject(left) ? FromObject(left, right) : exports_type2.IsRecord(left) ? FromRecord(left, right) : exports_type2.IsString(left) ? FromString(left, right) : exports_type2.IsSymbol(left) ? FromSymbol(left, right) : exports_type2.IsTuple(left) ? FromTuple3(left, right) : exports_type2.IsPromise(left) ? FromPromise(left, right) : exports_type2.IsUint8Array(left) ? FromUint8Array(left, right) : exports_type2.IsUndefined(left) ? FromUndefined(left, right) : exports_type2.IsUnion(left) ? FromUnion5(left, right) : exports_type2.IsUnknown(left) ? FromUnknown(left, right) : exports_type2.IsVoid(left) ? FromVoid(left, right) : Throw(`Unknown left type operand '${left[Kind]}'`);
}
function ExtendsCheck(left, right) {
  return Visit4(left, right);
}
var ExtendsResolverError, ExtendsResult;
var init_extends_check = __esm(() => {
  init_any2();
  init_function2();
  init_number2();
  init_string2();
  init_unknown2();
  init_template_literal2();
  init_patterns2();
  init_symbols2();
  init_error2();
  init_guard2();
  ExtendsResolverError = class ExtendsResolverError extends TypeBoxError {
  };
  (function(ExtendsResult2) {
    ExtendsResult2[ExtendsResult2["Union"] = 0] = "Union";
    ExtendsResult2[ExtendsResult2["True"] = 1] = "True";
    ExtendsResult2[ExtendsResult2["False"] = 2] = "False";
  })(ExtendsResult || (ExtendsResult = {}));
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/extends/extends-from-mapped-result.mjs
function FromProperties7(P, Right, True, False, options) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(P))
    Acc[K2] = Extends(P[K2], Right, True, False, Clone(options));
  return Acc;
}
function FromMappedResult6(Left, Right, True, False, options) {
  return FromProperties7(Left.properties, Right, True, False, options);
}
function ExtendsFromMappedResult(Left, Right, True, False, options) {
  const P = FromMappedResult6(Left, Right, True, False, options);
  return MappedResult(P);
}
var init_extends_from_mapped_result = __esm(() => {
  init_mapped2();
  init_extends();
  init_value();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/extends/extends.mjs
function ExtendsResolve(left, right, trueType, falseType) {
  const R = ExtendsCheck(left, right);
  return R === ExtendsResult.Union ? Union([trueType, falseType]) : R === ExtendsResult.True ? trueType : falseType;
}
function Extends(L, R, T, F, options) {
  return IsMappedResult(L) ? ExtendsFromMappedResult(L, R, T, F, options) : IsMappedKey(L) ? CreateType(ExtendsFromMappedKey(L, R, T, F, options)) : CreateType(ExtendsResolve(L, R, T, F), options);
}
var init_extends = __esm(() => {
  init_type2();
  init_union2();
  init_extends_check();
  init_extends_from_mapped_key();
  init_extends_from_mapped_result();
  init_kind();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/extends/extends-from-mapped-key.mjs
function FromPropertyKey(K, U, L, R, options) {
  return {
    [K]: Extends(Literal(K), U, L, R, Clone(options))
  };
}
function FromPropertyKeys(K, U, L, R, options) {
  return K.reduce((Acc, LK) => {
    return { ...Acc, ...FromPropertyKey(LK, U, L, R, options) };
  }, {});
}
function FromMappedKey2(K, U, L, R, options) {
  return FromPropertyKeys(K.keys, U, L, R, options);
}
function ExtendsFromMappedKey(T, U, L, R, options) {
  const P = FromMappedKey2(T, U, L, R, options);
  return MappedResult(P);
}
var init_extends_from_mapped_key = __esm(() => {
  init_mapped2();
  init_literal2();
  init_extends();
  init_value();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/extends/index.mjs
var init_extends2 = __esm(() => {
  init_extends_check();
  init_extends_from_mapped_key();
  init_extends_from_mapped_result();
  init_extends_undefined();
  init_extends();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/check/check.mjs
function IsAnyOrUnknown(schema) {
  return schema[Kind] === "Any" || schema[Kind] === "Unknown";
}
function IsDefined(value) {
  return value !== undefined;
}
function FromAny2(schema, references, value) {
  return true;
}
function FromArgument(schema, references, value) {
  return true;
}
function FromArray4(schema, references, value) {
  if (!IsArray(value))
    return false;
  if (IsDefined(schema.minItems) && !(value.length >= schema.minItems)) {
    return false;
  }
  if (IsDefined(schema.maxItems) && !(value.length <= schema.maxItems)) {
    return false;
  }
  for (const element of value) {
    if (!Visit5(schema.items, references, element))
      return false;
  }
  if (schema.uniqueItems === true && !function() {
    const set2 = new Set;
    for (const element of value) {
      const hashed = Hash(element);
      if (set2.has(hashed)) {
        return false;
      } else {
        set2.add(hashed);
      }
    }
    return true;
  }()) {
    return false;
  }
  if (!(IsDefined(schema.contains) || IsNumber(schema.minContains) || IsNumber(schema.maxContains))) {
    return true;
  }
  const containsSchema = IsDefined(schema.contains) ? schema.contains : Never();
  const containsCount = value.reduce((acc, value2) => Visit5(containsSchema, references, value2) ? acc + 1 : acc, 0);
  if (containsCount === 0) {
    return false;
  }
  if (IsNumber(schema.minContains) && containsCount < schema.minContains) {
    return false;
  }
  if (IsNumber(schema.maxContains) && containsCount > schema.maxContains) {
    return false;
  }
  return true;
}
function FromAsyncIterator2(schema, references, value) {
  return IsAsyncIterator(value);
}
function FromBigInt2(schema, references, value) {
  if (!IsBigInt(value))
    return false;
  if (IsDefined(schema.exclusiveMaximum) && !(value < schema.exclusiveMaximum)) {
    return false;
  }
  if (IsDefined(schema.exclusiveMinimum) && !(value > schema.exclusiveMinimum)) {
    return false;
  }
  if (IsDefined(schema.maximum) && !(value <= schema.maximum)) {
    return false;
  }
  if (IsDefined(schema.minimum) && !(value >= schema.minimum)) {
    return false;
  }
  if (IsDefined(schema.multipleOf) && !(value % schema.multipleOf === BigInt(0))) {
    return false;
  }
  return true;
}
function FromBoolean2(schema, references, value) {
  return IsBoolean(value);
}
function FromConstructor2(schema, references, value) {
  return Visit5(schema.returns, references, value.prototype);
}
function FromDate2(schema, references, value) {
  if (!IsDate(value))
    return false;
  if (IsDefined(schema.exclusiveMaximumTimestamp) && !(value.getTime() < schema.exclusiveMaximumTimestamp)) {
    return false;
  }
  if (IsDefined(schema.exclusiveMinimumTimestamp) && !(value.getTime() > schema.exclusiveMinimumTimestamp)) {
    return false;
  }
  if (IsDefined(schema.maximumTimestamp) && !(value.getTime() <= schema.maximumTimestamp)) {
    return false;
  }
  if (IsDefined(schema.minimumTimestamp) && !(value.getTime() >= schema.minimumTimestamp)) {
    return false;
  }
  if (IsDefined(schema.multipleOfTimestamp) && !(value.getTime() % schema.multipleOfTimestamp === 0)) {
    return false;
  }
  return true;
}
function FromFunction2(schema, references, value) {
  return IsFunction(value);
}
function FromImport(schema, references, value) {
  const definitions = globalThis.Object.values(schema.$defs);
  const target = schema.$defs[schema.$ref];
  return Visit5(target, [...references, ...definitions], value);
}
function FromInteger2(schema, references, value) {
  if (!IsInteger(value)) {
    return false;
  }
  if (IsDefined(schema.exclusiveMaximum) && !(value < schema.exclusiveMaximum)) {
    return false;
  }
  if (IsDefined(schema.exclusiveMinimum) && !(value > schema.exclusiveMinimum)) {
    return false;
  }
  if (IsDefined(schema.maximum) && !(value <= schema.maximum)) {
    return false;
  }
  if (IsDefined(schema.minimum) && !(value >= schema.minimum)) {
    return false;
  }
  if (IsDefined(schema.multipleOf) && !(value % schema.multipleOf === 0)) {
    return false;
  }
  return true;
}
function FromIntersect4(schema, references, value) {
  const check1 = schema.allOf.every((schema2) => Visit5(schema2, references, value));
  if (schema.unevaluatedProperties === false) {
    const keyPattern = new RegExp(KeyOfPattern(schema));
    const check2 = Object.getOwnPropertyNames(value).every((key) => keyPattern.test(key));
    return check1 && check2;
  } else if (IsSchema(schema.unevaluatedProperties)) {
    const keyCheck = new RegExp(KeyOfPattern(schema));
    const check2 = Object.getOwnPropertyNames(value).every((key) => keyCheck.test(key) || Visit5(schema.unevaluatedProperties, references, value[key]));
    return check1 && check2;
  } else {
    return check1;
  }
}
function FromIterator2(schema, references, value) {
  return IsIterator(value);
}
function FromLiteral3(schema, references, value) {
  return value === schema.const;
}
function FromNever2(schema, references, value) {
  return false;
}
function FromNot2(schema, references, value) {
  return !Visit5(schema.not, references, value);
}
function FromNull2(schema, references, value) {
  return IsNull(value);
}
function FromNumber2(schema, references, value) {
  if (!TypeSystemPolicy.IsNumberLike(value))
    return false;
  if (IsDefined(schema.exclusiveMaximum) && !(value < schema.exclusiveMaximum)) {
    return false;
  }
  if (IsDefined(schema.exclusiveMinimum) && !(value > schema.exclusiveMinimum)) {
    return false;
  }
  if (IsDefined(schema.minimum) && !(value >= schema.minimum)) {
    return false;
  }
  if (IsDefined(schema.maximum) && !(value <= schema.maximum)) {
    return false;
  }
  if (IsDefined(schema.multipleOf) && !(value % schema.multipleOf === 0)) {
    return false;
  }
  return true;
}
function FromObject2(schema, references, value) {
  if (!TypeSystemPolicy.IsObjectLike(value))
    return false;
  if (IsDefined(schema.minProperties) && !(Object.getOwnPropertyNames(value).length >= schema.minProperties)) {
    return false;
  }
  if (IsDefined(schema.maxProperties) && !(Object.getOwnPropertyNames(value).length <= schema.maxProperties)) {
    return false;
  }
  const knownKeys = Object.getOwnPropertyNames(schema.properties);
  for (const knownKey of knownKeys) {
    const property = schema.properties[knownKey];
    if (schema.required && schema.required.includes(knownKey)) {
      if (!Visit5(property, references, value[knownKey])) {
        return false;
      }
      if ((ExtendsUndefinedCheck(property) || IsAnyOrUnknown(property)) && !(knownKey in value)) {
        return false;
      }
    } else {
      if (TypeSystemPolicy.IsExactOptionalProperty(value, knownKey) && !Visit5(property, references, value[knownKey])) {
        return false;
      }
    }
  }
  if (schema.additionalProperties === false) {
    const valueKeys = Object.getOwnPropertyNames(value);
    if (schema.required && schema.required.length === knownKeys.length && valueKeys.length === knownKeys.length) {
      return true;
    } else {
      return valueKeys.every((valueKey) => knownKeys.includes(valueKey));
    }
  } else if (typeof schema.additionalProperties === "object") {
    const valueKeys = Object.getOwnPropertyNames(value);
    return valueKeys.every((key) => knownKeys.includes(key) || Visit5(schema.additionalProperties, references, value[key]));
  } else {
    return true;
  }
}
function FromPromise2(schema, references, value) {
  return IsPromise(value);
}
function FromRecord2(schema, references, value) {
  if (!TypeSystemPolicy.IsRecordLike(value)) {
    return false;
  }
  if (IsDefined(schema.minProperties) && !(Object.getOwnPropertyNames(value).length >= schema.minProperties)) {
    return false;
  }
  if (IsDefined(schema.maxProperties) && !(Object.getOwnPropertyNames(value).length <= schema.maxProperties)) {
    return false;
  }
  const [patternKey, patternSchema] = Object.entries(schema.patternProperties)[0];
  const regex = new RegExp(patternKey);
  const check1 = Object.entries(value).every(([key, value2]) => {
    return regex.test(key) ? Visit5(patternSchema, references, value2) : true;
  });
  const check2 = typeof schema.additionalProperties === "object" ? Object.entries(value).every(([key, value2]) => {
    return !regex.test(key) ? Visit5(schema.additionalProperties, references, value2) : true;
  }) : true;
  const check3 = schema.additionalProperties === false ? Object.getOwnPropertyNames(value).every((key) => {
    return regex.test(key);
  }) : true;
  return check1 && check2 && check3;
}
function FromRef2(schema, references, value) {
  return Visit5(Deref(schema, references), references, value);
}
function FromRegExp2(schema, references, value) {
  const regex = new RegExp(schema.source, schema.flags);
  if (IsDefined(schema.minLength)) {
    if (!(value.length >= schema.minLength))
      return false;
  }
  if (IsDefined(schema.maxLength)) {
    if (!(value.length <= schema.maxLength))
      return false;
  }
  return regex.test(value);
}
function FromString2(schema, references, value) {
  if (!IsString(value)) {
    return false;
  }
  if (IsDefined(schema.minLength)) {
    if (!(value.length >= schema.minLength))
      return false;
  }
  if (IsDefined(schema.maxLength)) {
    if (!(value.length <= schema.maxLength))
      return false;
  }
  if (IsDefined(schema.pattern)) {
    const regex = new RegExp(schema.pattern);
    if (!regex.test(value))
      return false;
  }
  if (IsDefined(schema.format)) {
    if (!exports_format.Has(schema.format))
      return false;
    const func = exports_format.Get(schema.format);
    return func(value);
  }
  return true;
}
function FromSymbol2(schema, references, value) {
  return IsSymbol(value);
}
function FromTemplateLiteral3(schema, references, value) {
  return IsString(value) && new RegExp(schema.pattern).test(value);
}
function FromThis(schema, references, value) {
  return Visit5(Deref(schema, references), references, value);
}
function FromTuple4(schema, references, value) {
  if (!IsArray(value)) {
    return false;
  }
  if (schema.items === undefined && !(value.length === 0)) {
    return false;
  }
  if (!(value.length === schema.maxItems)) {
    return false;
  }
  if (!schema.items) {
    return true;
  }
  for (let i = 0;i < schema.items.length; i++) {
    if (!Visit5(schema.items[i], references, value[i]))
      return false;
  }
  return true;
}
function FromUndefined2(schema, references, value) {
  return IsUndefined(value);
}
function FromUnion6(schema, references, value) {
  return schema.anyOf.some((inner) => Visit5(inner, references, value));
}
function FromUint8Array2(schema, references, value) {
  if (!IsUint8Array(value)) {
    return false;
  }
  if (IsDefined(schema.maxByteLength) && !(value.length <= schema.maxByteLength)) {
    return false;
  }
  if (IsDefined(schema.minByteLength) && !(value.length >= schema.minByteLength)) {
    return false;
  }
  return true;
}
function FromUnknown2(schema, references, value) {
  return true;
}
function FromVoid2(schema, references, value) {
  return TypeSystemPolicy.IsVoidLike(value);
}
function FromKind(schema, references, value) {
  if (!exports_type.Has(schema[Kind]))
    return false;
  const func = exports_type.Get(schema[Kind]);
  return func(schema, value);
}
function Visit5(schema, references, value) {
  const references_ = IsDefined(schema.$id) ? Pushref(schema, references) : references;
  const schema_ = schema;
  switch (schema_[Kind]) {
    case "Any":
      return FromAny2(schema_, references_, value);
    case "Argument":
      return FromArgument(schema_, references_, value);
    case "Array":
      return FromArray4(schema_, references_, value);
    case "AsyncIterator":
      return FromAsyncIterator2(schema_, references_, value);
    case "BigInt":
      return FromBigInt2(schema_, references_, value);
    case "Boolean":
      return FromBoolean2(schema_, references_, value);
    case "Constructor":
      return FromConstructor2(schema_, references_, value);
    case "Date":
      return FromDate2(schema_, references_, value);
    case "Function":
      return FromFunction2(schema_, references_, value);
    case "Import":
      return FromImport(schema_, references_, value);
    case "Integer":
      return FromInteger2(schema_, references_, value);
    case "Intersect":
      return FromIntersect4(schema_, references_, value);
    case "Iterator":
      return FromIterator2(schema_, references_, value);
    case "Literal":
      return FromLiteral3(schema_, references_, value);
    case "Never":
      return FromNever2(schema_, references_, value);
    case "Not":
      return FromNot2(schema_, references_, value);
    case "Null":
      return FromNull2(schema_, references_, value);
    case "Number":
      return FromNumber2(schema_, references_, value);
    case "Object":
      return FromObject2(schema_, references_, value);
    case "Promise":
      return FromPromise2(schema_, references_, value);
    case "Record":
      return FromRecord2(schema_, references_, value);
    case "Ref":
      return FromRef2(schema_, references_, value);
    case "RegExp":
      return FromRegExp2(schema_, references_, value);
    case "String":
      return FromString2(schema_, references_, value);
    case "Symbol":
      return FromSymbol2(schema_, references_, value);
    case "TemplateLiteral":
      return FromTemplateLiteral3(schema_, references_, value);
    case "This":
      return FromThis(schema_, references_, value);
    case "Tuple":
      return FromTuple4(schema_, references_, value);
    case "Undefined":
      return FromUndefined2(schema_, references_, value);
    case "Union":
      return FromUnion6(schema_, references_, value);
    case "Uint8Array":
      return FromUint8Array2(schema_, references_, value);
    case "Unknown":
      return FromUnknown2(schema_, references_, value);
    case "Void":
      return FromVoid2(schema_, references_, value);
    default:
      if (!exports_type.Has(schema_[Kind]))
        throw new ValueCheckUnknownTypeError(schema_);
      return FromKind(schema_, references_, value);
  }
}
function Check(...args2) {
  return args2.length === 3 ? Visit5(args2[0], args2[1], args2[2]) : Visit5(args2[0], [], args2[1]);
}
var ValueCheckUnknownTypeError;
var init_check = __esm(() => {
  init_system2();
  init_deref2();
  init_hash2();
  init_symbols2();
  init_keyof2();
  init_extends2();
  init_registry();
  init_error2();
  init_never2();
  init_guard();
  init_kind();
  ValueCheckUnknownTypeError = class ValueCheckUnknownTypeError extends TypeBoxError {
    constructor(schema) {
      super(`Unknown type`);
      this.schema = schema;
    }
  };
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/check/index.mjs
var init_check2 = __esm(() => {
  init_check();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/errors/errors.mjs
function EscapeKey(key) {
  return key.replace(/~/g, "~0").replace(/\//g, "~1");
}
function IsDefined2(value) {
  return value !== undefined;
}
function Create(errorType, schema, path, value, errors = []) {
  return {
    type: errorType,
    schema,
    path,
    value,
    message: GetErrorFunction()({ errorType, path, schema, value, errors }),
    errors
  };
}
function* FromAny3(schema, references, path, value) {}
function* FromArgument2(schema, references, path, value) {}
function* FromArray5(schema, references, path, value) {
  if (!IsArray(value)) {
    return yield Create(ValueErrorType.Array, schema, path, value);
  }
  if (IsDefined2(schema.minItems) && !(value.length >= schema.minItems)) {
    yield Create(ValueErrorType.ArrayMinItems, schema, path, value);
  }
  if (IsDefined2(schema.maxItems) && !(value.length <= schema.maxItems)) {
    yield Create(ValueErrorType.ArrayMaxItems, schema, path, value);
  }
  for (let i = 0;i < value.length; i++) {
    yield* Visit6(schema.items, references, `${path}/${i}`, value[i]);
  }
  if (schema.uniqueItems === true && !function() {
    const set2 = new Set;
    for (const element of value) {
      const hashed = Hash(element);
      if (set2.has(hashed)) {
        return false;
      } else {
        set2.add(hashed);
      }
    }
    return true;
  }()) {
    yield Create(ValueErrorType.ArrayUniqueItems, schema, path, value);
  }
  if (!(IsDefined2(schema.contains) || IsDefined2(schema.minContains) || IsDefined2(schema.maxContains))) {
    return;
  }
  const containsSchema = IsDefined2(schema.contains) ? schema.contains : Never();
  const containsCount = value.reduce((acc, value2, index) => Visit6(containsSchema, references, `${path}${index}`, value2).next().done === true ? acc + 1 : acc, 0);
  if (containsCount === 0) {
    yield Create(ValueErrorType.ArrayContains, schema, path, value);
  }
  if (IsNumber(schema.minContains) && containsCount < schema.minContains) {
    yield Create(ValueErrorType.ArrayMinContains, schema, path, value);
  }
  if (IsNumber(schema.maxContains) && containsCount > schema.maxContains) {
    yield Create(ValueErrorType.ArrayMaxContains, schema, path, value);
  }
}
function* FromAsyncIterator3(schema, references, path, value) {
  if (!IsAsyncIterator(value))
    yield Create(ValueErrorType.AsyncIterator, schema, path, value);
}
function* FromBigInt3(schema, references, path, value) {
  if (!IsBigInt(value))
    return yield Create(ValueErrorType.BigInt, schema, path, value);
  if (IsDefined2(schema.exclusiveMaximum) && !(value < schema.exclusiveMaximum)) {
    yield Create(ValueErrorType.BigIntExclusiveMaximum, schema, path, value);
  }
  if (IsDefined2(schema.exclusiveMinimum) && !(value > schema.exclusiveMinimum)) {
    yield Create(ValueErrorType.BigIntExclusiveMinimum, schema, path, value);
  }
  if (IsDefined2(schema.maximum) && !(value <= schema.maximum)) {
    yield Create(ValueErrorType.BigIntMaximum, schema, path, value);
  }
  if (IsDefined2(schema.minimum) && !(value >= schema.minimum)) {
    yield Create(ValueErrorType.BigIntMinimum, schema, path, value);
  }
  if (IsDefined2(schema.multipleOf) && !(value % schema.multipleOf === BigInt(0))) {
    yield Create(ValueErrorType.BigIntMultipleOf, schema, path, value);
  }
}
function* FromBoolean3(schema, references, path, value) {
  if (!IsBoolean(value))
    yield Create(ValueErrorType.Boolean, schema, path, value);
}
function* FromConstructor3(schema, references, path, value) {
  yield* Visit6(schema.returns, references, path, value.prototype);
}
function* FromDate3(schema, references, path, value) {
  if (!IsDate(value))
    return yield Create(ValueErrorType.Date, schema, path, value);
  if (IsDefined2(schema.exclusiveMaximumTimestamp) && !(value.getTime() < schema.exclusiveMaximumTimestamp)) {
    yield Create(ValueErrorType.DateExclusiveMaximumTimestamp, schema, path, value);
  }
  if (IsDefined2(schema.exclusiveMinimumTimestamp) && !(value.getTime() > schema.exclusiveMinimumTimestamp)) {
    yield Create(ValueErrorType.DateExclusiveMinimumTimestamp, schema, path, value);
  }
  if (IsDefined2(schema.maximumTimestamp) && !(value.getTime() <= schema.maximumTimestamp)) {
    yield Create(ValueErrorType.DateMaximumTimestamp, schema, path, value);
  }
  if (IsDefined2(schema.minimumTimestamp) && !(value.getTime() >= schema.minimumTimestamp)) {
    yield Create(ValueErrorType.DateMinimumTimestamp, schema, path, value);
  }
  if (IsDefined2(schema.multipleOfTimestamp) && !(value.getTime() % schema.multipleOfTimestamp === 0)) {
    yield Create(ValueErrorType.DateMultipleOfTimestamp, schema, path, value);
  }
}
function* FromFunction3(schema, references, path, value) {
  if (!IsFunction(value))
    yield Create(ValueErrorType.Function, schema, path, value);
}
function* FromImport2(schema, references, path, value) {
  const definitions = globalThis.Object.values(schema.$defs);
  const target = schema.$defs[schema.$ref];
  yield* Visit6(target, [...references, ...definitions], path, value);
}
function* FromInteger3(schema, references, path, value) {
  if (!IsInteger(value))
    return yield Create(ValueErrorType.Integer, schema, path, value);
  if (IsDefined2(schema.exclusiveMaximum) && !(value < schema.exclusiveMaximum)) {
    yield Create(ValueErrorType.IntegerExclusiveMaximum, schema, path, value);
  }
  if (IsDefined2(schema.exclusiveMinimum) && !(value > schema.exclusiveMinimum)) {
    yield Create(ValueErrorType.IntegerExclusiveMinimum, schema, path, value);
  }
  if (IsDefined2(schema.maximum) && !(value <= schema.maximum)) {
    yield Create(ValueErrorType.IntegerMaximum, schema, path, value);
  }
  if (IsDefined2(schema.minimum) && !(value >= schema.minimum)) {
    yield Create(ValueErrorType.IntegerMinimum, schema, path, value);
  }
  if (IsDefined2(schema.multipleOf) && !(value % schema.multipleOf === 0)) {
    yield Create(ValueErrorType.IntegerMultipleOf, schema, path, value);
  }
}
function* FromIntersect5(schema, references, path, value) {
  let hasError = false;
  for (const inner of schema.allOf) {
    for (const error2 of Visit6(inner, references, path, value)) {
      hasError = true;
      yield error2;
    }
  }
  if (hasError) {
    return yield Create(ValueErrorType.Intersect, schema, path, value);
  }
  if (schema.unevaluatedProperties === false) {
    const keyCheck = new RegExp(KeyOfPattern(schema));
    for (const valueKey of Object.getOwnPropertyNames(value)) {
      if (!keyCheck.test(valueKey)) {
        yield Create(ValueErrorType.IntersectUnevaluatedProperties, schema, `${path}/${valueKey}`, value);
      }
    }
  }
  if (typeof schema.unevaluatedProperties === "object") {
    const keyCheck = new RegExp(KeyOfPattern(schema));
    for (const valueKey of Object.getOwnPropertyNames(value)) {
      if (!keyCheck.test(valueKey)) {
        const next = Visit6(schema.unevaluatedProperties, references, `${path}/${valueKey}`, value[valueKey]).next();
        if (!next.done)
          yield next.value;
      }
    }
  }
}
function* FromIterator3(schema, references, path, value) {
  if (!IsIterator(value))
    yield Create(ValueErrorType.Iterator, schema, path, value);
}
function* FromLiteral4(schema, references, path, value) {
  if (!(value === schema.const))
    yield Create(ValueErrorType.Literal, schema, path, value);
}
function* FromNever3(schema, references, path, value) {
  yield Create(ValueErrorType.Never, schema, path, value);
}
function* FromNot3(schema, references, path, value) {
  if (Visit6(schema.not, references, path, value).next().done === true)
    yield Create(ValueErrorType.Not, schema, path, value);
}
function* FromNull3(schema, references, path, value) {
  if (!IsNull(value))
    yield Create(ValueErrorType.Null, schema, path, value);
}
function* FromNumber3(schema, references, path, value) {
  if (!TypeSystemPolicy.IsNumberLike(value))
    return yield Create(ValueErrorType.Number, schema, path, value);
  if (IsDefined2(schema.exclusiveMaximum) && !(value < schema.exclusiveMaximum)) {
    yield Create(ValueErrorType.NumberExclusiveMaximum, schema, path, value);
  }
  if (IsDefined2(schema.exclusiveMinimum) && !(value > schema.exclusiveMinimum)) {
    yield Create(ValueErrorType.NumberExclusiveMinimum, schema, path, value);
  }
  if (IsDefined2(schema.maximum) && !(value <= schema.maximum)) {
    yield Create(ValueErrorType.NumberMaximum, schema, path, value);
  }
  if (IsDefined2(schema.minimum) && !(value >= schema.minimum)) {
    yield Create(ValueErrorType.NumberMinimum, schema, path, value);
  }
  if (IsDefined2(schema.multipleOf) && !(value % schema.multipleOf === 0)) {
    yield Create(ValueErrorType.NumberMultipleOf, schema, path, value);
  }
}
function* FromObject3(schema, references, path, value) {
  if (!TypeSystemPolicy.IsObjectLike(value))
    return yield Create(ValueErrorType.Object, schema, path, value);
  if (IsDefined2(schema.minProperties) && !(Object.getOwnPropertyNames(value).length >= schema.minProperties)) {
    yield Create(ValueErrorType.ObjectMinProperties, schema, path, value);
  }
  if (IsDefined2(schema.maxProperties) && !(Object.getOwnPropertyNames(value).length <= schema.maxProperties)) {
    yield Create(ValueErrorType.ObjectMaxProperties, schema, path, value);
  }
  const requiredKeys = Array.isArray(schema.required) ? schema.required : [];
  const knownKeys = Object.getOwnPropertyNames(schema.properties);
  const unknownKeys = Object.getOwnPropertyNames(value);
  for (const requiredKey of requiredKeys) {
    if (unknownKeys.includes(requiredKey))
      continue;
    yield Create(ValueErrorType.ObjectRequiredProperty, schema.properties[requiredKey], `${path}/${EscapeKey(requiredKey)}`, undefined);
  }
  if (schema.additionalProperties === false) {
    for (const valueKey of unknownKeys) {
      if (!knownKeys.includes(valueKey)) {
        yield Create(ValueErrorType.ObjectAdditionalProperties, schema, `${path}/${EscapeKey(valueKey)}`, value[valueKey]);
      }
    }
  }
  if (typeof schema.additionalProperties === "object") {
    for (const valueKey of unknownKeys) {
      if (knownKeys.includes(valueKey))
        continue;
      yield* Visit6(schema.additionalProperties, references, `${path}/${EscapeKey(valueKey)}`, value[valueKey]);
    }
  }
  for (const knownKey of knownKeys) {
    const property = schema.properties[knownKey];
    if (schema.required && schema.required.includes(knownKey)) {
      yield* Visit6(property, references, `${path}/${EscapeKey(knownKey)}`, value[knownKey]);
      if (ExtendsUndefinedCheck(schema) && !(knownKey in value)) {
        yield Create(ValueErrorType.ObjectRequiredProperty, property, `${path}/${EscapeKey(knownKey)}`, undefined);
      }
    } else {
      if (TypeSystemPolicy.IsExactOptionalProperty(value, knownKey)) {
        yield* Visit6(property, references, `${path}/${EscapeKey(knownKey)}`, value[knownKey]);
      }
    }
  }
}
function* FromPromise3(schema, references, path, value) {
  if (!IsPromise(value))
    yield Create(ValueErrorType.Promise, schema, path, value);
}
function* FromRecord3(schema, references, path, value) {
  if (!TypeSystemPolicy.IsRecordLike(value))
    return yield Create(ValueErrorType.Object, schema, path, value);
  if (IsDefined2(schema.minProperties) && !(Object.getOwnPropertyNames(value).length >= schema.minProperties)) {
    yield Create(ValueErrorType.ObjectMinProperties, schema, path, value);
  }
  if (IsDefined2(schema.maxProperties) && !(Object.getOwnPropertyNames(value).length <= schema.maxProperties)) {
    yield Create(ValueErrorType.ObjectMaxProperties, schema, path, value);
  }
  const [patternKey, patternSchema] = Object.entries(schema.patternProperties)[0];
  const regex = new RegExp(patternKey);
  for (const [propertyKey, propertyValue] of Object.entries(value)) {
    if (regex.test(propertyKey))
      yield* Visit6(patternSchema, references, `${path}/${EscapeKey(propertyKey)}`, propertyValue);
  }
  if (typeof schema.additionalProperties === "object") {
    for (const [propertyKey, propertyValue] of Object.entries(value)) {
      if (!regex.test(propertyKey))
        yield* Visit6(schema.additionalProperties, references, `${path}/${EscapeKey(propertyKey)}`, propertyValue);
    }
  }
  if (schema.additionalProperties === false) {
    for (const [propertyKey, propertyValue] of Object.entries(value)) {
      if (regex.test(propertyKey))
        continue;
      return yield Create(ValueErrorType.ObjectAdditionalProperties, schema, `${path}/${EscapeKey(propertyKey)}`, propertyValue);
    }
  }
}
function* FromRef3(schema, references, path, value) {
  yield* Visit6(Deref(schema, references), references, path, value);
}
function* FromRegExp3(schema, references, path, value) {
  if (!IsString(value))
    return yield Create(ValueErrorType.String, schema, path, value);
  if (IsDefined2(schema.minLength) && !(value.length >= schema.minLength)) {
    yield Create(ValueErrorType.StringMinLength, schema, path, value);
  }
  if (IsDefined2(schema.maxLength) && !(value.length <= schema.maxLength)) {
    yield Create(ValueErrorType.StringMaxLength, schema, path, value);
  }
  const regex = new RegExp(schema.source, schema.flags);
  if (!regex.test(value)) {
    return yield Create(ValueErrorType.RegExp, schema, path, value);
  }
}
function* FromString3(schema, references, path, value) {
  if (!IsString(value))
    return yield Create(ValueErrorType.String, schema, path, value);
  if (IsDefined2(schema.minLength) && !(value.length >= schema.minLength)) {
    yield Create(ValueErrorType.StringMinLength, schema, path, value);
  }
  if (IsDefined2(schema.maxLength) && !(value.length <= schema.maxLength)) {
    yield Create(ValueErrorType.StringMaxLength, schema, path, value);
  }
  if (IsString(schema.pattern)) {
    const regex = new RegExp(schema.pattern);
    if (!regex.test(value)) {
      yield Create(ValueErrorType.StringPattern, schema, path, value);
    }
  }
  if (IsString(schema.format)) {
    if (!exports_format.Has(schema.format)) {
      yield Create(ValueErrorType.StringFormatUnknown, schema, path, value);
    } else {
      const format = exports_format.Get(schema.format);
      if (!format(value)) {
        yield Create(ValueErrorType.StringFormat, schema, path, value);
      }
    }
  }
}
function* FromSymbol3(schema, references, path, value) {
  if (!IsSymbol(value))
    yield Create(ValueErrorType.Symbol, schema, path, value);
}
function* FromTemplateLiteral4(schema, references, path, value) {
  if (!IsString(value))
    return yield Create(ValueErrorType.String, schema, path, value);
  const regex = new RegExp(schema.pattern);
  if (!regex.test(value)) {
    yield Create(ValueErrorType.StringPattern, schema, path, value);
  }
}
function* FromThis2(schema, references, path, value) {
  yield* Visit6(Deref(schema, references), references, path, value);
}
function* FromTuple5(schema, references, path, value) {
  if (!IsArray(value))
    return yield Create(ValueErrorType.Tuple, schema, path, value);
  if (schema.items === undefined && !(value.length === 0)) {
    return yield Create(ValueErrorType.TupleLength, schema, path, value);
  }
  if (!(value.length === schema.maxItems)) {
    return yield Create(ValueErrorType.TupleLength, schema, path, value);
  }
  if (!schema.items) {
    return;
  }
  for (let i = 0;i < schema.items.length; i++) {
    yield* Visit6(schema.items[i], references, `${path}/${i}`, value[i]);
  }
}
function* FromUndefined3(schema, references, path, value) {
  if (!IsUndefined(value))
    yield Create(ValueErrorType.Undefined, schema, path, value);
}
function* FromUnion7(schema, references, path, value) {
  if (Check(schema, references, value))
    return;
  const errors = schema.anyOf.map((variant) => new ValueErrorIterator(Visit6(variant, references, path, value)));
  yield Create(ValueErrorType.Union, schema, path, value, errors);
}
function* FromUint8Array3(schema, references, path, value) {
  if (!IsUint8Array(value))
    return yield Create(ValueErrorType.Uint8Array, schema, path, value);
  if (IsDefined2(schema.maxByteLength) && !(value.length <= schema.maxByteLength)) {
    yield Create(ValueErrorType.Uint8ArrayMaxByteLength, schema, path, value);
  }
  if (IsDefined2(schema.minByteLength) && !(value.length >= schema.minByteLength)) {
    yield Create(ValueErrorType.Uint8ArrayMinByteLength, schema, path, value);
  }
}
function* FromUnknown3(schema, references, path, value) {}
function* FromVoid3(schema, references, path, value) {
  if (!TypeSystemPolicy.IsVoidLike(value))
    yield Create(ValueErrorType.Void, schema, path, value);
}
function* FromKind2(schema, references, path, value) {
  const check2 = exports_type.Get(schema[Kind]);
  if (!check2(schema, value))
    yield Create(ValueErrorType.Kind, schema, path, value);
}
function* Visit6(schema, references, path, value) {
  const references_ = IsDefined2(schema.$id) ? [...references, schema] : references;
  const schema_ = schema;
  switch (schema_[Kind]) {
    case "Any":
      return yield* FromAny3(schema_, references_, path, value);
    case "Argument":
      return yield* FromArgument2(schema_, references_, path, value);
    case "Array":
      return yield* FromArray5(schema_, references_, path, value);
    case "AsyncIterator":
      return yield* FromAsyncIterator3(schema_, references_, path, value);
    case "BigInt":
      return yield* FromBigInt3(schema_, references_, path, value);
    case "Boolean":
      return yield* FromBoolean3(schema_, references_, path, value);
    case "Constructor":
      return yield* FromConstructor3(schema_, references_, path, value);
    case "Date":
      return yield* FromDate3(schema_, references_, path, value);
    case "Function":
      return yield* FromFunction3(schema_, references_, path, value);
    case "Import":
      return yield* FromImport2(schema_, references_, path, value);
    case "Integer":
      return yield* FromInteger3(schema_, references_, path, value);
    case "Intersect":
      return yield* FromIntersect5(schema_, references_, path, value);
    case "Iterator":
      return yield* FromIterator3(schema_, references_, path, value);
    case "Literal":
      return yield* FromLiteral4(schema_, references_, path, value);
    case "Never":
      return yield* FromNever3(schema_, references_, path, value);
    case "Not":
      return yield* FromNot3(schema_, references_, path, value);
    case "Null":
      return yield* FromNull3(schema_, references_, path, value);
    case "Number":
      return yield* FromNumber3(schema_, references_, path, value);
    case "Object":
      return yield* FromObject3(schema_, references_, path, value);
    case "Promise":
      return yield* FromPromise3(schema_, references_, path, value);
    case "Record":
      return yield* FromRecord3(schema_, references_, path, value);
    case "Ref":
      return yield* FromRef3(schema_, references_, path, value);
    case "RegExp":
      return yield* FromRegExp3(schema_, references_, path, value);
    case "String":
      return yield* FromString3(schema_, references_, path, value);
    case "Symbol":
      return yield* FromSymbol3(schema_, references_, path, value);
    case "TemplateLiteral":
      return yield* FromTemplateLiteral4(schema_, references_, path, value);
    case "This":
      return yield* FromThis2(schema_, references_, path, value);
    case "Tuple":
      return yield* FromTuple5(schema_, references_, path, value);
    case "Undefined":
      return yield* FromUndefined3(schema_, references_, path, value);
    case "Union":
      return yield* FromUnion7(schema_, references_, path, value);
    case "Uint8Array":
      return yield* FromUint8Array3(schema_, references_, path, value);
    case "Unknown":
      return yield* FromUnknown3(schema_, references_, path, value);
    case "Void":
      return yield* FromVoid3(schema_, references_, path, value);
    default:
      if (!exports_type.Has(schema_[Kind]))
        throw new ValueErrorsUnknownTypeError(schema);
      return yield* FromKind2(schema_, references_, path, value);
  }
}
function Errors(...args2) {
  const iterator2 = args2.length === 3 ? Visit6(args2[0], args2[1], "", args2[2]) : Visit6(args2[0], [], "", args2[1]);
  return new ValueErrorIterator(iterator2);
}
var ValueErrorType, ValueErrorsUnknownTypeError, ValueErrorIterator;
var init_errors = __esm(() => {
  init_system2();
  init_keyof2();
  init_registry();
  init_extends_undefined();
  init_function3();
  init_error2();
  init_deref2();
  init_hash2();
  init_check2();
  init_symbols2();
  init_never2();
  init_guard();
  (function(ValueErrorType2) {
    ValueErrorType2[ValueErrorType2["ArrayContains"] = 0] = "ArrayContains";
    ValueErrorType2[ValueErrorType2["ArrayMaxContains"] = 1] = "ArrayMaxContains";
    ValueErrorType2[ValueErrorType2["ArrayMaxItems"] = 2] = "ArrayMaxItems";
    ValueErrorType2[ValueErrorType2["ArrayMinContains"] = 3] = "ArrayMinContains";
    ValueErrorType2[ValueErrorType2["ArrayMinItems"] = 4] = "ArrayMinItems";
    ValueErrorType2[ValueErrorType2["ArrayUniqueItems"] = 5] = "ArrayUniqueItems";
    ValueErrorType2[ValueErrorType2["Array"] = 6] = "Array";
    ValueErrorType2[ValueErrorType2["AsyncIterator"] = 7] = "AsyncIterator";
    ValueErrorType2[ValueErrorType2["BigIntExclusiveMaximum"] = 8] = "BigIntExclusiveMaximum";
    ValueErrorType2[ValueErrorType2["BigIntExclusiveMinimum"] = 9] = "BigIntExclusiveMinimum";
    ValueErrorType2[ValueErrorType2["BigIntMaximum"] = 10] = "BigIntMaximum";
    ValueErrorType2[ValueErrorType2["BigIntMinimum"] = 11] = "BigIntMinimum";
    ValueErrorType2[ValueErrorType2["BigIntMultipleOf"] = 12] = "BigIntMultipleOf";
    ValueErrorType2[ValueErrorType2["BigInt"] = 13] = "BigInt";
    ValueErrorType2[ValueErrorType2["Boolean"] = 14] = "Boolean";
    ValueErrorType2[ValueErrorType2["DateExclusiveMaximumTimestamp"] = 15] = "DateExclusiveMaximumTimestamp";
    ValueErrorType2[ValueErrorType2["DateExclusiveMinimumTimestamp"] = 16] = "DateExclusiveMinimumTimestamp";
    ValueErrorType2[ValueErrorType2["DateMaximumTimestamp"] = 17] = "DateMaximumTimestamp";
    ValueErrorType2[ValueErrorType2["DateMinimumTimestamp"] = 18] = "DateMinimumTimestamp";
    ValueErrorType2[ValueErrorType2["DateMultipleOfTimestamp"] = 19] = "DateMultipleOfTimestamp";
    ValueErrorType2[ValueErrorType2["Date"] = 20] = "Date";
    ValueErrorType2[ValueErrorType2["Function"] = 21] = "Function";
    ValueErrorType2[ValueErrorType2["IntegerExclusiveMaximum"] = 22] = "IntegerExclusiveMaximum";
    ValueErrorType2[ValueErrorType2["IntegerExclusiveMinimum"] = 23] = "IntegerExclusiveMinimum";
    ValueErrorType2[ValueErrorType2["IntegerMaximum"] = 24] = "IntegerMaximum";
    ValueErrorType2[ValueErrorType2["IntegerMinimum"] = 25] = "IntegerMinimum";
    ValueErrorType2[ValueErrorType2["IntegerMultipleOf"] = 26] = "IntegerMultipleOf";
    ValueErrorType2[ValueErrorType2["Integer"] = 27] = "Integer";
    ValueErrorType2[ValueErrorType2["IntersectUnevaluatedProperties"] = 28] = "IntersectUnevaluatedProperties";
    ValueErrorType2[ValueErrorType2["Intersect"] = 29] = "Intersect";
    ValueErrorType2[ValueErrorType2["Iterator"] = 30] = "Iterator";
    ValueErrorType2[ValueErrorType2["Kind"] = 31] = "Kind";
    ValueErrorType2[ValueErrorType2["Literal"] = 32] = "Literal";
    ValueErrorType2[ValueErrorType2["Never"] = 33] = "Never";
    ValueErrorType2[ValueErrorType2["Not"] = 34] = "Not";
    ValueErrorType2[ValueErrorType2["Null"] = 35] = "Null";
    ValueErrorType2[ValueErrorType2["NumberExclusiveMaximum"] = 36] = "NumberExclusiveMaximum";
    ValueErrorType2[ValueErrorType2["NumberExclusiveMinimum"] = 37] = "NumberExclusiveMinimum";
    ValueErrorType2[ValueErrorType2["NumberMaximum"] = 38] = "NumberMaximum";
    ValueErrorType2[ValueErrorType2["NumberMinimum"] = 39] = "NumberMinimum";
    ValueErrorType2[ValueErrorType2["NumberMultipleOf"] = 40] = "NumberMultipleOf";
    ValueErrorType2[ValueErrorType2["Number"] = 41] = "Number";
    ValueErrorType2[ValueErrorType2["ObjectAdditionalProperties"] = 42] = "ObjectAdditionalProperties";
    ValueErrorType2[ValueErrorType2["ObjectMaxProperties"] = 43] = "ObjectMaxProperties";
    ValueErrorType2[ValueErrorType2["ObjectMinProperties"] = 44] = "ObjectMinProperties";
    ValueErrorType2[ValueErrorType2["ObjectRequiredProperty"] = 45] = "ObjectRequiredProperty";
    ValueErrorType2[ValueErrorType2["Object"] = 46] = "Object";
    ValueErrorType2[ValueErrorType2["Promise"] = 47] = "Promise";
    ValueErrorType2[ValueErrorType2["RegExp"] = 48] = "RegExp";
    ValueErrorType2[ValueErrorType2["StringFormatUnknown"] = 49] = "StringFormatUnknown";
    ValueErrorType2[ValueErrorType2["StringFormat"] = 50] = "StringFormat";
    ValueErrorType2[ValueErrorType2["StringMaxLength"] = 51] = "StringMaxLength";
    ValueErrorType2[ValueErrorType2["StringMinLength"] = 52] = "StringMinLength";
    ValueErrorType2[ValueErrorType2["StringPattern"] = 53] = "StringPattern";
    ValueErrorType2[ValueErrorType2["String"] = 54] = "String";
    ValueErrorType2[ValueErrorType2["Symbol"] = 55] = "Symbol";
    ValueErrorType2[ValueErrorType2["TupleLength"] = 56] = "TupleLength";
    ValueErrorType2[ValueErrorType2["Tuple"] = 57] = "Tuple";
    ValueErrorType2[ValueErrorType2["Uint8ArrayMaxByteLength"] = 58] = "Uint8ArrayMaxByteLength";
    ValueErrorType2[ValueErrorType2["Uint8ArrayMinByteLength"] = 59] = "Uint8ArrayMinByteLength";
    ValueErrorType2[ValueErrorType2["Uint8Array"] = 60] = "Uint8Array";
    ValueErrorType2[ValueErrorType2["Undefined"] = 61] = "Undefined";
    ValueErrorType2[ValueErrorType2["Union"] = 62] = "Union";
    ValueErrorType2[ValueErrorType2["Void"] = 63] = "Void";
  })(ValueErrorType || (ValueErrorType = {}));
  ValueErrorsUnknownTypeError = class ValueErrorsUnknownTypeError extends TypeBoxError {
    constructor(schema) {
      super("Unknown type");
      this.schema = schema;
    }
  };
  ValueErrorIterator = class ValueErrorIterator {
    constructor(iterator2) {
      this.iterator = iterator2;
    }
    [Symbol.iterator]() {
      return this.iterator;
    }
    First() {
      const next = this.iterator.next();
      return next.done ? undefined : next.value;
    }
  };
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/errors/index.mjs
var init_errors2 = __esm(() => {
  init_errors();
  init_function3();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/assert/assert.mjs
function AssertValue(schema, references, value) {
  if (Check(schema, references, value))
    return;
  throw new AssertError(Errors(schema, references, value));
}
function Assert(...args2) {
  return args2.length === 3 ? AssertValue(args2[0], args2[1], args2[2]) : AssertValue(args2[0], [], args2[1]);
}
var __classPrivateFieldSet = function(receiver, state, value, kind, f) {
  if (kind === "m")
    throw new TypeError("Private method is not writable");
  if (kind === "a" && !f)
    throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
    throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
}, __classPrivateFieldGet = function(receiver, state, kind, f) {
  if (kind === "a" && !f)
    throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
    throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}, _AssertError_instances, _AssertError_iterator, _AssertError_Iterator, AssertError;
var init_assert = __esm(() => {
  init_errors2();
  init_error();
  init_check();
  AssertError = class AssertError extends TypeBoxError {
    constructor(iterator2) {
      const error2 = iterator2.First();
      super(error2 === undefined ? "Invalid Value" : error2.message);
      _AssertError_instances.add(this);
      _AssertError_iterator.set(this, undefined);
      __classPrivateFieldSet(this, _AssertError_iterator, iterator2, "f");
      this.error = error2;
    }
    Errors() {
      return new ValueErrorIterator(__classPrivateFieldGet(this, _AssertError_instances, "m", _AssertError_Iterator).call(this));
    }
  };
  _AssertError_iterator = new WeakMap, _AssertError_instances = new WeakSet, _AssertError_Iterator = function* _AssertError_Iterator2() {
    if (this.error)
      yield this.error;
    yield* __classPrivateFieldGet(this, _AssertError_iterator, "f");
  };
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/assert/index.mjs
var init_assert2 = __esm(() => {
  init_assert();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/clone/clone.mjs
function FromObject4(value) {
  const Acc = {};
  for (const key of Object.getOwnPropertyNames(value)) {
    Acc[key] = Clone2(value[key]);
  }
  for (const key of Object.getOwnPropertySymbols(value)) {
    Acc[key] = Clone2(value[key]);
  }
  return Acc;
}
function FromArray6(value) {
  return value.map((element) => Clone2(element));
}
function FromTypedArray(value) {
  return value.slice();
}
function FromMap(value) {
  return new Map(Clone2([...value.entries()]));
}
function FromSet(value) {
  return new Set(Clone2([...value.entries()]));
}
function FromDate4(value) {
  return new Date(value.toISOString());
}
function FromValue(value) {
  return value;
}
function Clone2(value) {
  if (IsArray(value))
    return FromArray6(value);
  if (IsDate(value))
    return FromDate4(value);
  if (IsTypedArray(value))
    return FromTypedArray(value);
  if (IsMap(value))
    return FromMap(value);
  if (IsSet(value))
    return FromSet(value);
  if (IsObject(value))
    return FromObject4(value);
  if (IsValueType(value))
    return FromValue(value);
  throw new Error("ValueClone: Unable to clone value");
}
var init_clone = __esm(() => {
  init_guard();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/clone/index.mjs
var init_clone2 = __esm(() => {
  init_clone();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/create/create.mjs
function FromDefault(value) {
  return IsFunction(value) ? value() : Clone2(value);
}
function FromAny4(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    return {};
  }
}
function FromArgument3(schema, references) {
  return {};
}
function FromArray7(schema, references) {
  if (schema.uniqueItems === true && !HasPropertyKey(schema, "default")) {
    throw new ValueCreateError(schema, "Array with the uniqueItems constraint requires a default value");
  } else if ("contains" in schema && !HasPropertyKey(schema, "default")) {
    throw new ValueCreateError(schema, "Array with the contains constraint requires a default value");
  } else if ("default" in schema) {
    return FromDefault(schema.default);
  } else if (schema.minItems !== undefined) {
    return Array.from({ length: schema.minItems }).map((item) => {
      return Visit7(schema.items, references);
    });
  } else {
    return [];
  }
}
function FromAsyncIterator4(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    return async function* () {}();
  }
}
function FromBigInt4(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    return BigInt(0);
  }
}
function FromBoolean4(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    return false;
  }
}
function FromConstructor4(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    const value = Visit7(schema.returns, references);
    if (typeof value === "object" && !Array.isArray(value)) {
      return class {
        constructor() {
          for (const [key, val] of Object.entries(value)) {
            const self = this;
            self[key] = val;
          }
        }
      };
    } else {
      return class {
      };
    }
  }
}
function FromDate5(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else if (schema.minimumTimestamp !== undefined) {
    return new Date(schema.minimumTimestamp);
  } else {
    return new Date;
  }
}
function FromFunction4(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    return () => Visit7(schema.returns, references);
  }
}
function FromImport3(schema, references) {
  const definitions = globalThis.Object.values(schema.$defs);
  const target = schema.$defs[schema.$ref];
  return Visit7(target, [...references, ...definitions]);
}
function FromInteger4(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else if (schema.minimum !== undefined) {
    return schema.minimum;
  } else {
    return 0;
  }
}
function FromIntersect6(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    const value = schema.allOf.reduce((acc, schema2) => {
      const next = Visit7(schema2, references);
      return typeof next === "object" ? { ...acc, ...next } : next;
    }, {});
    if (!Check(schema, references, value))
      throw new ValueCreateError(schema, "Intersect produced invalid value. Consider using a default value.");
    return value;
  }
}
function FromIterator4(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    return function* () {}();
  }
}
function FromLiteral5(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    return schema.const;
  }
}
function FromNever4(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    throw new ValueCreateError(schema, "Never types cannot be created. Consider using a default value.");
  }
}
function FromNot4(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    throw new ValueCreateError(schema, "Not types must have a default value");
  }
}
function FromNull4(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    return null;
  }
}
function FromNumber4(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else if (schema.minimum !== undefined) {
    return schema.minimum;
  } else {
    return 0;
  }
}
function FromObject5(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    const required = new Set(schema.required);
    const Acc = {};
    for (const [key, subschema] of Object.entries(schema.properties)) {
      if (!required.has(key))
        continue;
      Acc[key] = Visit7(subschema, references);
    }
    return Acc;
  }
}
function FromPromise4(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    return Promise.resolve(Visit7(schema.item, references));
  }
}
function FromRecord4(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    return {};
  }
}
function FromRef4(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    return Visit7(Deref(schema, references), references);
  }
}
function FromRegExp4(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    throw new ValueCreateError(schema, "RegExp types cannot be created. Consider using a default value.");
  }
}
function FromString4(schema, references) {
  if (schema.pattern !== undefined) {
    if (!HasPropertyKey(schema, "default")) {
      throw new ValueCreateError(schema, "String types with patterns must specify a default value");
    } else {
      return FromDefault(schema.default);
    }
  } else if (schema.format !== undefined) {
    if (!HasPropertyKey(schema, "default")) {
      throw new ValueCreateError(schema, "String types with formats must specify a default value");
    } else {
      return FromDefault(schema.default);
    }
  } else {
    if (HasPropertyKey(schema, "default")) {
      return FromDefault(schema.default);
    } else if (schema.minLength !== undefined) {
      return Array.from({ length: schema.minLength }).map(() => " ").join("");
    } else {
      return "";
    }
  }
}
function FromSymbol4(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else if ("value" in schema) {
    return Symbol.for(schema.value);
  } else {
    return Symbol();
  }
}
function FromTemplateLiteral5(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  }
  if (!IsTemplateLiteralFinite(schema))
    throw new ValueCreateError(schema, "Can only create template literals that produce a finite variants. Consider using a default value.");
  const generated = TemplateLiteralGenerate(schema);
  return generated[0];
}
function FromThis3(schema, references) {
  if (recursiveDepth++ > recursiveMaxDepth)
    throw new ValueCreateError(schema, "Cannot create recursive type as it appears possibly infinite. Consider using a default.");
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    return Visit7(Deref(schema, references), references);
  }
}
function FromTuple6(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  }
  if (schema.items === undefined) {
    return [];
  } else {
    return Array.from({ length: schema.minItems }).map((_, index) => Visit7(schema.items[index], references));
  }
}
function FromUndefined4(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    return;
  }
}
function FromUnion8(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else if (schema.anyOf.length === 0) {
    throw new Error("ValueCreate.Union: Cannot create Union with zero variants");
  } else {
    return Visit7(schema.anyOf[0], references);
  }
}
function FromUint8Array4(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else if (schema.minByteLength !== undefined) {
    return new Uint8Array(schema.minByteLength);
  } else {
    return new Uint8Array(0);
  }
}
function FromUnknown4(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    return {};
  }
}
function FromVoid4(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    return;
  }
}
function FromKind3(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    throw new Error("User defined types must specify a default value");
  }
}
function Visit7(schema, references) {
  const references_ = Pushref(schema, references);
  const schema_ = schema;
  switch (schema_[Kind]) {
    case "Any":
      return FromAny4(schema_, references_);
    case "Argument":
      return FromArgument3(schema_, references_);
    case "Array":
      return FromArray7(schema_, references_);
    case "AsyncIterator":
      return FromAsyncIterator4(schema_, references_);
    case "BigInt":
      return FromBigInt4(schema_, references_);
    case "Boolean":
      return FromBoolean4(schema_, references_);
    case "Constructor":
      return FromConstructor4(schema_, references_);
    case "Date":
      return FromDate5(schema_, references_);
    case "Function":
      return FromFunction4(schema_, references_);
    case "Import":
      return FromImport3(schema_, references_);
    case "Integer":
      return FromInteger4(schema_, references_);
    case "Intersect":
      return FromIntersect6(schema_, references_);
    case "Iterator":
      return FromIterator4(schema_, references_);
    case "Literal":
      return FromLiteral5(schema_, references_);
    case "Never":
      return FromNever4(schema_, references_);
    case "Not":
      return FromNot4(schema_, references_);
    case "Null":
      return FromNull4(schema_, references_);
    case "Number":
      return FromNumber4(schema_, references_);
    case "Object":
      return FromObject5(schema_, references_);
    case "Promise":
      return FromPromise4(schema_, references_);
    case "Record":
      return FromRecord4(schema_, references_);
    case "Ref":
      return FromRef4(schema_, references_);
    case "RegExp":
      return FromRegExp4(schema_, references_);
    case "String":
      return FromString4(schema_, references_);
    case "Symbol":
      return FromSymbol4(schema_, references_);
    case "TemplateLiteral":
      return FromTemplateLiteral5(schema_, references_);
    case "This":
      return FromThis3(schema_, references_);
    case "Tuple":
      return FromTuple6(schema_, references_);
    case "Undefined":
      return FromUndefined4(schema_, references_);
    case "Union":
      return FromUnion8(schema_, references_);
    case "Uint8Array":
      return FromUint8Array4(schema_, references_);
    case "Unknown":
      return FromUnknown4(schema_, references_);
    case "Void":
      return FromVoid4(schema_, references_);
    default:
      if (!exports_type.Has(schema_[Kind]))
        throw new ValueCreateError(schema_, "Unknown type");
      return FromKind3(schema_, references_);
  }
}
function Create2(...args2) {
  recursiveDepth = 0;
  return args2.length === 2 ? Visit7(args2[0], args2[1]) : Visit7(args2[0], []);
}
var ValueCreateError, recursiveMaxDepth = 512, recursiveDepth = 0;
var init_create2 = __esm(() => {
  init_guard();
  init_check2();
  init_clone2();
  init_deref2();
  init_template_literal2();
  init_registry();
  init_symbols2();
  init_error2();
  ValueCreateError = class ValueCreateError extends TypeBoxError {
    constructor(schema, message2) {
      super(message2);
      this.schema = schema;
    }
  };
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/create/index.mjs
var init_create3 = __esm(() => {
  init_create2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/cast/cast.mjs
function ScoreUnion(schema, references, value) {
  if (schema[Kind] === "Object" && typeof value === "object" && !IsNull(value)) {
    const object2 = schema;
    const keys = Object.getOwnPropertyNames(value);
    const entries = Object.entries(object2.properties);
    return entries.reduce((acc, [key, schema2]) => {
      const literal2 = schema2[Kind] === "Literal" && schema2.const === value[key] ? 100 : 0;
      const checks = Check(schema2, references, value[key]) ? 10 : 0;
      const exists = keys.includes(key) ? 1 : 0;
      return acc + (literal2 + checks + exists);
    }, 0);
  } else if (schema[Kind] === "Union") {
    const schemas = schema.anyOf.map((schema2) => Deref(schema2, references));
    const scores = schemas.map((schema2) => ScoreUnion(schema2, references, value));
    return Math.max(...scores);
  } else {
    return Check(schema, references, value) ? 1 : 0;
  }
}
function SelectUnion(union3, references, value) {
  const schemas = union3.anyOf.map((schema) => Deref(schema, references));
  let [select, best] = [schemas[0], 0];
  for (const schema of schemas) {
    const score = ScoreUnion(schema, references, value);
    if (score > best) {
      select = schema;
      best = score;
    }
  }
  return select;
}
function CastUnion(union3, references, value) {
  if ("default" in union3) {
    return typeof value === "function" ? union3.default : Clone2(union3.default);
  } else {
    const schema = SelectUnion(union3, references, value);
    return Cast(schema, references, value);
  }
}
function DefaultClone(schema, references, value) {
  return Check(schema, references, value) ? Clone2(value) : Create2(schema, references);
}
function Default(schema, references, value) {
  return Check(schema, references, value) ? value : Create2(schema, references);
}
function FromArray8(schema, references, value) {
  if (Check(schema, references, value))
    return Clone2(value);
  const created = IsArray(value) ? Clone2(value) : Create2(schema, references);
  const minimum = IsNumber(schema.minItems) && created.length < schema.minItems ? [...created, ...Array.from({ length: schema.minItems - created.length }, () => null)] : created;
  const maximum = IsNumber(schema.maxItems) && minimum.length > schema.maxItems ? minimum.slice(0, schema.maxItems) : minimum;
  const casted = maximum.map((value2) => Visit8(schema.items, references, value2));
  if (schema.uniqueItems !== true)
    return casted;
  const unique = [...new Set(casted)];
  if (!Check(schema, references, unique))
    throw new ValueCastError(schema, "Array cast produced invalid data due to uniqueItems constraint");
  return unique;
}
function FromConstructor5(schema, references, value) {
  if (Check(schema, references, value))
    return Create2(schema, references);
  const required = new Set(schema.returns.required || []);
  const result = function() {};
  for (const [key, property] of Object.entries(schema.returns.properties)) {
    if (!required.has(key) && value.prototype[key] === undefined)
      continue;
    result.prototype[key] = Visit8(property, references, value.prototype[key]);
  }
  return result;
}
function FromImport4(schema, references, value) {
  const definitions = globalThis.Object.values(schema.$defs);
  const target = schema.$defs[schema.$ref];
  return Visit8(target, [...references, ...definitions], value);
}
function IntersectAssign(correct, value) {
  if (IsObject(correct) && !IsObject(value) || !IsObject(correct) && IsObject(value))
    return correct;
  if (!IsObject(correct) || !IsObject(value))
    return value;
  return globalThis.Object.getOwnPropertyNames(correct).reduce((result, key) => {
    const property = key in value ? IntersectAssign(correct[key], value[key]) : correct[key];
    return { ...result, [key]: property };
  }, {});
}
function FromIntersect7(schema, references, value) {
  if (Check(schema, references, value))
    return value;
  const correct = Create2(schema, references);
  const assigned = IntersectAssign(correct, value);
  return Check(schema, references, assigned) ? assigned : correct;
}
function FromNever5(schema, references, value) {
  throw new ValueCastError(schema, "Never types cannot be cast");
}
function FromObject6(schema, references, value) {
  if (Check(schema, references, value))
    return value;
  if (value === null || typeof value !== "object")
    return Create2(schema, references);
  const required = new Set(schema.required || []);
  const result = {};
  for (const [key, property] of Object.entries(schema.properties)) {
    if (!required.has(key) && value[key] === undefined)
      continue;
    result[key] = Visit8(property, references, value[key]);
  }
  if (typeof schema.additionalProperties === "object") {
    const propertyNames = Object.getOwnPropertyNames(schema.properties);
    for (const propertyName of Object.getOwnPropertyNames(value)) {
      if (propertyNames.includes(propertyName))
        continue;
      result[propertyName] = Visit8(schema.additionalProperties, references, value[propertyName]);
    }
  }
  return result;
}
function FromRecord5(schema, references, value) {
  if (Check(schema, references, value))
    return Clone2(value);
  if (value === null || typeof value !== "object" || Array.isArray(value) || value instanceof Date)
    return Create2(schema, references);
  const subschemaPropertyName = Object.getOwnPropertyNames(schema.patternProperties)[0];
  const subschema = schema.patternProperties[subschemaPropertyName];
  const result = {};
  for (const [propKey, propValue] of Object.entries(value)) {
    result[propKey] = Visit8(subschema, references, propValue);
  }
  return result;
}
function FromRef5(schema, references, value) {
  return Visit8(Deref(schema, references), references, value);
}
function FromThis4(schema, references, value) {
  return Visit8(Deref(schema, references), references, value);
}
function FromTuple7(schema, references, value) {
  if (Check(schema, references, value))
    return Clone2(value);
  if (!IsArray(value))
    return Create2(schema, references);
  if (schema.items === undefined)
    return [];
  return schema.items.map((schema2, index) => Visit8(schema2, references, value[index]));
}
function FromUnion9(schema, references, value) {
  return Check(schema, references, value) ? Clone2(value) : CastUnion(schema, references, value);
}
function Visit8(schema, references, value) {
  const references_ = IsString(schema.$id) ? Pushref(schema, references) : references;
  const schema_ = schema;
  switch (schema[Kind]) {
    case "Array":
      return FromArray8(schema_, references_, value);
    case "Constructor":
      return FromConstructor5(schema_, references_, value);
    case "Import":
      return FromImport4(schema_, references_, value);
    case "Intersect":
      return FromIntersect7(schema_, references_, value);
    case "Never":
      return FromNever5(schema_, references_, value);
    case "Object":
      return FromObject6(schema_, references_, value);
    case "Record":
      return FromRecord5(schema_, references_, value);
    case "Ref":
      return FromRef5(schema_, references_, value);
    case "This":
      return FromThis4(schema_, references_, value);
    case "Tuple":
      return FromTuple7(schema_, references_, value);
    case "Union":
      return FromUnion9(schema_, references_, value);
    case "Date":
    case "Symbol":
    case "Uint8Array":
      return DefaultClone(schema, references, value);
    default:
      return Default(schema_, references_, value);
  }
}
function Cast(...args2) {
  return args2.length === 3 ? Visit8(args2[0], args2[1], args2[2]) : Visit8(args2[0], [], args2[1]);
}
var ValueCastError;
var init_cast = __esm(() => {
  init_guard();
  init_error2();
  init_symbols2();
  init_create3();
  init_check2();
  init_clone2();
  init_deref2();
  ValueCastError = class ValueCastError extends TypeBoxError {
    constructor(schema, message2) {
      super(message2);
      this.schema = schema;
    }
  };
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/cast/index.mjs
var init_cast2 = __esm(() => {
  init_cast();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/clean/clean.mjs
function IsCheckable(schema) {
  return IsKind(schema) && schema[Kind] !== "Unsafe";
}
function FromArray9(schema, references, value) {
  if (!IsArray(value))
    return value;
  return value.map((value2) => Visit9(schema.items, references, value2));
}
function FromImport5(schema, references, value) {
  const definitions = globalThis.Object.values(schema.$defs);
  const target = schema.$defs[schema.$ref];
  return Visit9(target, [...references, ...definitions], value);
}
function FromIntersect8(schema, references, value) {
  const unevaluatedProperties = schema.unevaluatedProperties;
  const intersections = schema.allOf.map((schema2) => Visit9(schema2, references, Clone2(value)));
  const composite = intersections.reduce((acc, value2) => IsObject(value2) ? { ...acc, ...value2 } : value2, {});
  if (!IsObject(value) || !IsObject(composite) || !IsKind(unevaluatedProperties))
    return composite;
  const knownkeys = KeyOfPropertyKeys(schema);
  for (const key of Object.getOwnPropertyNames(value)) {
    if (knownkeys.includes(key))
      continue;
    if (Check(unevaluatedProperties, references, value[key])) {
      composite[key] = Visit9(unevaluatedProperties, references, value[key]);
    }
  }
  return composite;
}
function FromObject7(schema, references, value) {
  if (!IsObject(value) || IsArray(value))
    return value;
  const additionalProperties = schema.additionalProperties;
  for (const key of Object.getOwnPropertyNames(value)) {
    if (HasPropertyKey(schema.properties, key)) {
      value[key] = Visit9(schema.properties[key], references, value[key]);
      continue;
    }
    if (IsKind(additionalProperties) && Check(additionalProperties, references, value[key])) {
      value[key] = Visit9(additionalProperties, references, value[key]);
      continue;
    }
    delete value[key];
  }
  return value;
}
function FromRecord6(schema, references, value) {
  if (!IsObject(value))
    return value;
  const additionalProperties = schema.additionalProperties;
  const propertyKeys = Object.getOwnPropertyNames(value);
  const [propertyKey, propertySchema] = Object.entries(schema.patternProperties)[0];
  const propertyKeyTest = new RegExp(propertyKey);
  for (const key of propertyKeys) {
    if (propertyKeyTest.test(key)) {
      value[key] = Visit9(propertySchema, references, value[key]);
      continue;
    }
    if (IsKind(additionalProperties) && Check(additionalProperties, references, value[key])) {
      value[key] = Visit9(additionalProperties, references, value[key]);
      continue;
    }
    delete value[key];
  }
  return value;
}
function FromRef6(schema, references, value) {
  return Visit9(Deref(schema, references), references, value);
}
function FromThis5(schema, references, value) {
  return Visit9(Deref(schema, references), references, value);
}
function FromTuple8(schema, references, value) {
  if (!IsArray(value))
    return value;
  if (IsUndefined(schema.items))
    return [];
  const length = Math.min(value.length, schema.items.length);
  for (let i = 0;i < length; i++) {
    value[i] = Visit9(schema.items[i], references, value[i]);
  }
  return value.length > length ? value.slice(0, length) : value;
}
function FromUnion10(schema, references, value) {
  for (const inner of schema.anyOf) {
    if (IsCheckable(inner) && Check(inner, references, value)) {
      return Visit9(inner, references, value);
    }
  }
  return value;
}
function Visit9(schema, references, value) {
  const references_ = IsString(schema.$id) ? Pushref(schema, references) : references;
  const schema_ = schema;
  switch (schema_[Kind]) {
    case "Array":
      return FromArray9(schema_, references_, value);
    case "Import":
      return FromImport5(schema_, references_, value);
    case "Intersect":
      return FromIntersect8(schema_, references_, value);
    case "Object":
      return FromObject7(schema_, references_, value);
    case "Record":
      return FromRecord6(schema_, references_, value);
    case "Ref":
      return FromRef6(schema_, references_, value);
    case "This":
      return FromThis5(schema_, references_, value);
    case "Tuple":
      return FromTuple8(schema_, references_, value);
    case "Union":
      return FromUnion10(schema_, references_, value);
    default:
      return value;
  }
}
function Clean(...args2) {
  return args2.length === 3 ? Visit9(args2[0], args2[1], args2[2]) : Visit9(args2[0], [], args2[1]);
}
var init_clean = __esm(() => {
  init_keyof2();
  init_check2();
  init_clone2();
  init_deref2();
  init_symbols2();
  init_guard();
  init_kind();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/clean/index.mjs
var init_clean2 = __esm(() => {
  init_clean();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/convert/convert.mjs
function IsStringNumeric(value) {
  return IsString(value) && !isNaN(value) && !isNaN(parseFloat(value));
}
function IsValueToString(value) {
  return IsBigInt(value) || IsBoolean(value) || IsNumber(value);
}
function IsValueTrue(value) {
  return value === true || IsNumber(value) && value === 1 || IsBigInt(value) && value === BigInt("1") || IsString(value) && (value.toLowerCase() === "true" || value === "1");
}
function IsValueFalse(value) {
  return value === false || IsNumber(value) && (value === 0 || Object.is(value, -0)) || IsBigInt(value) && value === BigInt("0") || IsString(value) && (value.toLowerCase() === "false" || value === "0" || value === "-0");
}
function IsTimeStringWithTimeZone(value) {
  return IsString(value) && /^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i.test(value);
}
function IsTimeStringWithoutTimeZone(value) {
  return IsString(value) && /^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)?$/i.test(value);
}
function IsDateTimeStringWithTimeZone(value) {
  return IsString(value) && /^\d\d\d\d-[0-1]\d-[0-3]\dt(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i.test(value);
}
function IsDateTimeStringWithoutTimeZone(value) {
  return IsString(value) && /^\d\d\d\d-[0-1]\d-[0-3]\dt(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)?$/i.test(value);
}
function IsDateString(value) {
  return IsString(value) && /^\d\d\d\d-[0-1]\d-[0-3]\d$/i.test(value);
}
function TryConvertLiteralString(value, target) {
  const conversion = TryConvertString(value);
  return conversion === target ? conversion : value;
}
function TryConvertLiteralNumber(value, target) {
  const conversion = TryConvertNumber(value);
  return conversion === target ? conversion : value;
}
function TryConvertLiteralBoolean(value, target) {
  const conversion = TryConvertBoolean(value);
  return conversion === target ? conversion : value;
}
function TryConvertLiteral(schema, value) {
  return IsString(schema.const) ? TryConvertLiteralString(value, schema.const) : IsNumber(schema.const) ? TryConvertLiteralNumber(value, schema.const) : IsBoolean(schema.const) ? TryConvertLiteralBoolean(value, schema.const) : value;
}
function TryConvertBoolean(value) {
  return IsValueTrue(value) ? true : IsValueFalse(value) ? false : value;
}
function TryConvertBigInt(value) {
  const truncateInteger = (value2) => value2.split(".")[0];
  return IsStringNumeric(value) ? BigInt(truncateInteger(value)) : IsNumber(value) ? BigInt(Math.trunc(value)) : IsValueFalse(value) ? BigInt(0) : IsValueTrue(value) ? BigInt(1) : value;
}
function TryConvertString(value) {
  return IsSymbol(value) && value.description !== undefined ? value.description.toString() : IsValueToString(value) ? value.toString() : value;
}
function TryConvertNumber(value) {
  return IsStringNumeric(value) ? parseFloat(value) : IsValueTrue(value) ? 1 : IsValueFalse(value) ? 0 : value;
}
function TryConvertInteger(value) {
  return IsStringNumeric(value) ? parseInt(value) : IsNumber(value) ? Math.trunc(value) : IsValueTrue(value) ? 1 : IsValueFalse(value) ? 0 : value;
}
function TryConvertNull(value) {
  return IsString(value) && value.toLowerCase() === "null" ? null : value;
}
function TryConvertUndefined(value) {
  return IsString(value) && value === "undefined" ? undefined : value;
}
function TryConvertDate(value) {
  return IsDate(value) ? value : IsNumber(value) ? new Date(value) : IsValueTrue(value) ? new Date(1) : IsValueFalse(value) ? new Date(0) : IsStringNumeric(value) ? new Date(parseInt(value)) : IsTimeStringWithoutTimeZone(value) ? new Date(`1970-01-01T${value}.000Z`) : IsTimeStringWithTimeZone(value) ? new Date(`1970-01-01T${value}`) : IsDateTimeStringWithoutTimeZone(value) ? new Date(`${value}.000Z`) : IsDateTimeStringWithTimeZone(value) ? new Date(value) : IsDateString(value) ? new Date(`${value}T00:00:00.000Z`) : value;
}
function Default2(value) {
  return value;
}
function FromArray10(schema, references, value) {
  const elements = IsArray(value) ? value : [value];
  return elements.map((element) => Visit10(schema.items, references, element));
}
function FromBigInt5(schema, references, value) {
  return TryConvertBigInt(value);
}
function FromBoolean5(schema, references, value) {
  return TryConvertBoolean(value);
}
function FromDate6(schema, references, value) {
  return TryConvertDate(value);
}
function FromImport6(schema, references, value) {
  const definitions = globalThis.Object.values(schema.$defs);
  const target = schema.$defs[schema.$ref];
  return Visit10(target, [...references, ...definitions], value);
}
function FromInteger5(schema, references, value) {
  return TryConvertInteger(value);
}
function FromIntersect9(schema, references, value) {
  return schema.allOf.reduce((value2, schema2) => Visit10(schema2, references, value2), value);
}
function FromLiteral6(schema, references, value) {
  return TryConvertLiteral(schema, value);
}
function FromNull5(schema, references, value) {
  return TryConvertNull(value);
}
function FromNumber5(schema, references, value) {
  return TryConvertNumber(value);
}
function FromObject8(schema, references, value) {
  if (!IsObject(value) || IsArray(value))
    return value;
  for (const propertyKey of Object.getOwnPropertyNames(schema.properties)) {
    if (!HasPropertyKey(value, propertyKey))
      continue;
    value[propertyKey] = Visit10(schema.properties[propertyKey], references, value[propertyKey]);
  }
  return value;
}
function FromRecord7(schema, references, value) {
  const isConvertable = IsObject(value) && !IsArray(value);
  if (!isConvertable)
    return value;
  const propertyKey = Object.getOwnPropertyNames(schema.patternProperties)[0];
  const property = schema.patternProperties[propertyKey];
  for (const [propKey, propValue] of Object.entries(value)) {
    value[propKey] = Visit10(property, references, propValue);
  }
  return value;
}
function FromRef7(schema, references, value) {
  return Visit10(Deref(schema, references), references, value);
}
function FromString5(schema, references, value) {
  return TryConvertString(value);
}
function FromSymbol5(schema, references, value) {
  return IsString(value) || IsNumber(value) ? Symbol(value) : value;
}
function FromThis6(schema, references, value) {
  return Visit10(Deref(schema, references), references, value);
}
function FromTuple9(schema, references, value) {
  const isConvertable = IsArray(value) && !IsUndefined(schema.items);
  if (!isConvertable)
    return value;
  return value.map((value2, index) => {
    return index < schema.items.length ? Visit10(schema.items[index], references, value2) : value2;
  });
}
function FromUndefined5(schema, references, value) {
  return TryConvertUndefined(value);
}
function FromUnion11(schema, references, value) {
  for (const subschema of schema.anyOf) {
    if (Check(subschema, references, value)) {
      return value;
    }
  }
  for (const subschema of schema.anyOf) {
    const converted = Visit10(subschema, references, Clone2(value));
    if (!Check(subschema, references, converted))
      continue;
    return converted;
  }
  return value;
}
function Visit10(schema, references, value) {
  const references_ = Pushref(schema, references);
  const schema_ = schema;
  switch (schema[Kind]) {
    case "Array":
      return FromArray10(schema_, references_, value);
    case "BigInt":
      return FromBigInt5(schema_, references_, value);
    case "Boolean":
      return FromBoolean5(schema_, references_, value);
    case "Date":
      return FromDate6(schema_, references_, value);
    case "Import":
      return FromImport6(schema_, references_, value);
    case "Integer":
      return FromInteger5(schema_, references_, value);
    case "Intersect":
      return FromIntersect9(schema_, references_, value);
    case "Literal":
      return FromLiteral6(schema_, references_, value);
    case "Null":
      return FromNull5(schema_, references_, value);
    case "Number":
      return FromNumber5(schema_, references_, value);
    case "Object":
      return FromObject8(schema_, references_, value);
    case "Record":
      return FromRecord7(schema_, references_, value);
    case "Ref":
      return FromRef7(schema_, references_, value);
    case "String":
      return FromString5(schema_, references_, value);
    case "Symbol":
      return FromSymbol5(schema_, references_, value);
    case "This":
      return FromThis6(schema_, references_, value);
    case "Tuple":
      return FromTuple9(schema_, references_, value);
    case "Undefined":
      return FromUndefined5(schema_, references_, value);
    case "Union":
      return FromUnion11(schema_, references_, value);
    default:
      return Default2(value);
  }
}
function Convert(...args2) {
  return args2.length === 3 ? Visit10(args2[0], args2[1], args2[2]) : Visit10(args2[0], [], args2[1]);
}
var init_convert = __esm(() => {
  init_clone2();
  init_check2();
  init_deref2();
  init_symbols2();
  init_guard();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/convert/index.mjs
var init_convert2 = __esm(() => {
  init_convert();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/transform/decode.mjs
function Default3(schema, path, value) {
  try {
    return IsTransform(schema) ? schema[TransformKind].Decode(value) : value;
  } catch (error2) {
    throw new TransformDecodeError(schema, path, value, error2);
  }
}
function FromArray11(schema, references, path, value) {
  return IsArray(value) ? Default3(schema, path, value.map((value2, index) => Visit11(schema.items, references, `${path}/${index}`, value2))) : Default3(schema, path, value);
}
function FromIntersect10(schema, references, path, value) {
  if (!IsObject(value) || IsValueType(value))
    return Default3(schema, path, value);
  const knownEntries = KeyOfPropertyEntries(schema);
  const knownKeys = knownEntries.map((entry) => entry[0]);
  const knownProperties = { ...value };
  for (const [knownKey, knownSchema] of knownEntries)
    if (knownKey in knownProperties) {
      knownProperties[knownKey] = Visit11(knownSchema, references, `${path}/${knownKey}`, knownProperties[knownKey]);
    }
  if (!IsTransform(schema.unevaluatedProperties)) {
    return Default3(schema, path, knownProperties);
  }
  const unknownKeys = Object.getOwnPropertyNames(knownProperties);
  const unevaluatedProperties = schema.unevaluatedProperties;
  const unknownProperties = { ...knownProperties };
  for (const key of unknownKeys)
    if (!knownKeys.includes(key)) {
      unknownProperties[key] = Default3(unevaluatedProperties, `${path}/${key}`, unknownProperties[key]);
    }
  return Default3(schema, path, unknownProperties);
}
function FromImport7(schema, references, path, value) {
  const additional = globalThis.Object.values(schema.$defs);
  const target = schema.$defs[schema.$ref];
  const result = Visit11(target, [...references, ...additional], path, value);
  return Default3(schema, path, result);
}
function FromNot5(schema, references, path, value) {
  return Default3(schema, path, Visit11(schema.not, references, path, value));
}
function FromObject9(schema, references, path, value) {
  if (!IsObject(value))
    return Default3(schema, path, value);
  const knownKeys = KeyOfPropertyKeys(schema);
  const knownProperties = { ...value };
  for (const key of knownKeys) {
    if (!HasPropertyKey(knownProperties, key))
      continue;
    if (IsUndefined(knownProperties[key]) && (!IsUndefined3(schema.properties[key]) || TypeSystemPolicy.IsExactOptionalProperty(knownProperties, key)))
      continue;
    knownProperties[key] = Visit11(schema.properties[key], references, `${path}/${key}`, knownProperties[key]);
  }
  if (!IsSchema(schema.additionalProperties)) {
    return Default3(schema, path, knownProperties);
  }
  const unknownKeys = Object.getOwnPropertyNames(knownProperties);
  const additionalProperties = schema.additionalProperties;
  const unknownProperties = { ...knownProperties };
  for (const key of unknownKeys)
    if (!knownKeys.includes(key)) {
      unknownProperties[key] = Default3(additionalProperties, `${path}/${key}`, unknownProperties[key]);
    }
  return Default3(schema, path, unknownProperties);
}
function FromRecord8(schema, references, path, value) {
  if (!IsObject(value))
    return Default3(schema, path, value);
  const pattern2 = Object.getOwnPropertyNames(schema.patternProperties)[0];
  const knownKeys = new RegExp(pattern2);
  const knownProperties = { ...value };
  for (const key of Object.getOwnPropertyNames(value))
    if (knownKeys.test(key)) {
      knownProperties[key] = Visit11(schema.patternProperties[pattern2], references, `${path}/${key}`, knownProperties[key]);
    }
  if (!IsSchema(schema.additionalProperties)) {
    return Default3(schema, path, knownProperties);
  }
  const unknownKeys = Object.getOwnPropertyNames(knownProperties);
  const additionalProperties = schema.additionalProperties;
  const unknownProperties = { ...knownProperties };
  for (const key of unknownKeys)
    if (!knownKeys.test(key)) {
      unknownProperties[key] = Default3(additionalProperties, `${path}/${key}`, unknownProperties[key]);
    }
  return Default3(schema, path, unknownProperties);
}
function FromRef8(schema, references, path, value) {
  const target = Deref(schema, references);
  return Default3(schema, path, Visit11(target, references, path, value));
}
function FromThis7(schema, references, path, value) {
  const target = Deref(schema, references);
  return Default3(schema, path, Visit11(target, references, path, value));
}
function FromTuple10(schema, references, path, value) {
  return IsArray(value) && IsArray(schema.items) ? Default3(schema, path, schema.items.map((schema2, index) => Visit11(schema2, references, `${path}/${index}`, value[index]))) : Default3(schema, path, value);
}
function FromUnion12(schema, references, path, value) {
  for (const subschema of schema.anyOf) {
    if (!Check(subschema, references, value))
      continue;
    const decoded = Visit11(subschema, references, path, value);
    return Default3(schema, path, decoded);
  }
  return Default3(schema, path, value);
}
function Visit11(schema, references, path, value) {
  const references_ = Pushref(schema, references);
  const schema_ = schema;
  switch (schema[Kind]) {
    case "Array":
      return FromArray11(schema_, references_, path, value);
    case "Import":
      return FromImport7(schema_, references_, path, value);
    case "Intersect":
      return FromIntersect10(schema_, references_, path, value);
    case "Not":
      return FromNot5(schema_, references_, path, value);
    case "Object":
      return FromObject9(schema_, references_, path, value);
    case "Record":
      return FromRecord8(schema_, references_, path, value);
    case "Ref":
      return FromRef8(schema_, references_, path, value);
    case "Symbol":
      return Default3(schema_, path, value);
    case "This":
      return FromThis7(schema_, references_, path, value);
    case "Tuple":
      return FromTuple10(schema_, references_, path, value);
    case "Union":
      return FromUnion12(schema_, references_, path, value);
    default:
      return Default3(schema_, path, value);
  }
}
function TransformDecode(schema, references, value) {
  return Visit11(schema, references, "", value);
}
var TransformDecodeCheckError, TransformDecodeError;
var init_decode = __esm(() => {
  init_policy();
  init_symbols2();
  init_error2();
  init_keyof2();
  init_deref2();
  init_check2();
  init_guard();
  init_kind();
  TransformDecodeCheckError = class TransformDecodeCheckError extends TypeBoxError {
    constructor(schema, value, error2) {
      super(`Unable to decode value as it does not match the expected schema`);
      this.schema = schema;
      this.value = value;
      this.error = error2;
    }
  };
  TransformDecodeError = class TransformDecodeError extends TypeBoxError {
    constructor(schema, path, value, error2) {
      super(error2 instanceof Error ? error2.message : "Unknown error");
      this.schema = schema;
      this.path = path;
      this.value = value;
      this.error = error2;
    }
  };
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/transform/encode.mjs
function Default4(schema, path, value) {
  try {
    return IsTransform(schema) ? schema[TransformKind].Encode(value) : value;
  } catch (error2) {
    throw new TransformEncodeError(schema, path, value, error2);
  }
}
function FromArray12(schema, references, path, value) {
  const defaulted = Default4(schema, path, value);
  return IsArray(defaulted) ? defaulted.map((value2, index) => Visit12(schema.items, references, `${path}/${index}`, value2)) : defaulted;
}
function FromImport8(schema, references, path, value) {
  const additional = globalThis.Object.values(schema.$defs);
  const target = schema.$defs[schema.$ref];
  const result = Default4(schema, path, value);
  return Visit12(target, [...references, ...additional], path, result);
}
function FromIntersect11(schema, references, path, value) {
  const defaulted = Default4(schema, path, value);
  if (!IsObject(value) || IsValueType(value))
    return defaulted;
  const knownEntries = KeyOfPropertyEntries(schema);
  const knownKeys = knownEntries.map((entry) => entry[0]);
  const knownProperties = { ...defaulted };
  for (const [knownKey, knownSchema] of knownEntries)
    if (knownKey in knownProperties) {
      knownProperties[knownKey] = Visit12(knownSchema, references, `${path}/${knownKey}`, knownProperties[knownKey]);
    }
  if (!IsTransform(schema.unevaluatedProperties)) {
    return knownProperties;
  }
  const unknownKeys = Object.getOwnPropertyNames(knownProperties);
  const unevaluatedProperties = schema.unevaluatedProperties;
  const properties = { ...knownProperties };
  for (const key of unknownKeys)
    if (!knownKeys.includes(key)) {
      properties[key] = Default4(unevaluatedProperties, `${path}/${key}`, properties[key]);
    }
  return properties;
}
function FromNot6(schema, references, path, value) {
  return Default4(schema.not, path, Default4(schema, path, value));
}
function FromObject10(schema, references, path, value) {
  const defaulted = Default4(schema, path, value);
  if (!IsObject(defaulted))
    return defaulted;
  const knownKeys = KeyOfPropertyKeys(schema);
  const knownProperties = { ...defaulted };
  for (const key of knownKeys) {
    if (!HasPropertyKey(knownProperties, key))
      continue;
    if (IsUndefined(knownProperties[key]) && (!IsUndefined3(schema.properties[key]) || TypeSystemPolicy.IsExactOptionalProperty(knownProperties, key)))
      continue;
    knownProperties[key] = Visit12(schema.properties[key], references, `${path}/${key}`, knownProperties[key]);
  }
  if (!IsSchema(schema.additionalProperties)) {
    return knownProperties;
  }
  const unknownKeys = Object.getOwnPropertyNames(knownProperties);
  const additionalProperties = schema.additionalProperties;
  const properties = { ...knownProperties };
  for (const key of unknownKeys)
    if (!knownKeys.includes(key)) {
      properties[key] = Default4(additionalProperties, `${path}/${key}`, properties[key]);
    }
  return properties;
}
function FromRecord9(schema, references, path, value) {
  const defaulted = Default4(schema, path, value);
  if (!IsObject(value))
    return defaulted;
  const pattern2 = Object.getOwnPropertyNames(schema.patternProperties)[0];
  const knownKeys = new RegExp(pattern2);
  const knownProperties = { ...defaulted };
  for (const key of Object.getOwnPropertyNames(value))
    if (knownKeys.test(key)) {
      knownProperties[key] = Visit12(schema.patternProperties[pattern2], references, `${path}/${key}`, knownProperties[key]);
    }
  if (!IsSchema(schema.additionalProperties)) {
    return knownProperties;
  }
  const unknownKeys = Object.getOwnPropertyNames(knownProperties);
  const additionalProperties = schema.additionalProperties;
  const properties = { ...knownProperties };
  for (const key of unknownKeys)
    if (!knownKeys.test(key)) {
      properties[key] = Default4(additionalProperties, `${path}/${key}`, properties[key]);
    }
  return properties;
}
function FromRef9(schema, references, path, value) {
  const target = Deref(schema, references);
  const resolved = Visit12(target, references, path, value);
  return Default4(schema, path, resolved);
}
function FromThis8(schema, references, path, value) {
  const target = Deref(schema, references);
  const resolved = Visit12(target, references, path, value);
  return Default4(schema, path, resolved);
}
function FromTuple11(schema, references, path, value) {
  const value1 = Default4(schema, path, value);
  return IsArray(schema.items) ? schema.items.map((schema2, index) => Visit12(schema2, references, `${path}/${index}`, value1[index])) : [];
}
function FromUnion13(schema, references, path, value) {
  for (const subschema of schema.anyOf) {
    if (!Check(subschema, references, value))
      continue;
    const value1 = Visit12(subschema, references, path, value);
    return Default4(schema, path, value1);
  }
  for (const subschema of schema.anyOf) {
    const value1 = Visit12(subschema, references, path, value);
    if (!Check(schema, references, value1))
      continue;
    return Default4(schema, path, value1);
  }
  return Default4(schema, path, value);
}
function Visit12(schema, references, path, value) {
  const references_ = Pushref(schema, references);
  const schema_ = schema;
  switch (schema[Kind]) {
    case "Array":
      return FromArray12(schema_, references_, path, value);
    case "Import":
      return FromImport8(schema_, references_, path, value);
    case "Intersect":
      return FromIntersect11(schema_, references_, path, value);
    case "Not":
      return FromNot6(schema_, references_, path, value);
    case "Object":
      return FromObject10(schema_, references_, path, value);
    case "Record":
      return FromRecord9(schema_, references_, path, value);
    case "Ref":
      return FromRef9(schema_, references_, path, value);
    case "This":
      return FromThis8(schema_, references_, path, value);
    case "Tuple":
      return FromTuple11(schema_, references_, path, value);
    case "Union":
      return FromUnion13(schema_, references_, path, value);
    default:
      return Default4(schema_, path, value);
  }
}
function TransformEncode(schema, references, value) {
  return Visit12(schema, references, "", value);
}
var TransformEncodeCheckError, TransformEncodeError;
var init_encode = __esm(() => {
  init_policy();
  init_symbols2();
  init_error2();
  init_keyof2();
  init_deref2();
  init_check2();
  init_guard();
  init_kind();
  TransformEncodeCheckError = class TransformEncodeCheckError extends TypeBoxError {
    constructor(schema, value, error2) {
      super(`The encoded value does not match the expected schema`);
      this.schema = schema;
      this.value = value;
      this.error = error2;
    }
  };
  TransformEncodeError = class TransformEncodeError extends TypeBoxError {
    constructor(schema, path, value, error2) {
      super(`${error2 instanceof Error ? error2.message : "Unknown error"}`);
      this.schema = schema;
      this.path = path;
      this.value = value;
      this.error = error2;
    }
  };
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/transform/has.mjs
function FromArray13(schema, references) {
  return IsTransform(schema) || Visit13(schema.items, references);
}
function FromAsyncIterator5(schema, references) {
  return IsTransform(schema) || Visit13(schema.items, references);
}
function FromConstructor6(schema, references) {
  return IsTransform(schema) || Visit13(schema.returns, references) || schema.parameters.some((schema2) => Visit13(schema2, references));
}
function FromFunction5(schema, references) {
  return IsTransform(schema) || Visit13(schema.returns, references) || schema.parameters.some((schema2) => Visit13(schema2, references));
}
function FromIntersect12(schema, references) {
  return IsTransform(schema) || IsTransform(schema.unevaluatedProperties) || schema.allOf.some((schema2) => Visit13(schema2, references));
}
function FromImport9(schema, references) {
  const additional = globalThis.Object.getOwnPropertyNames(schema.$defs).reduce((result, key) => [...result, schema.$defs[key]], []);
  const target = schema.$defs[schema.$ref];
  return IsTransform(schema) || Visit13(target, [...additional, ...references]);
}
function FromIterator5(schema, references) {
  return IsTransform(schema) || Visit13(schema.items, references);
}
function FromNot7(schema, references) {
  return IsTransform(schema) || Visit13(schema.not, references);
}
function FromObject11(schema, references) {
  return IsTransform(schema) || Object.values(schema.properties).some((schema2) => Visit13(schema2, references)) || IsSchema(schema.additionalProperties) && Visit13(schema.additionalProperties, references);
}
function FromPromise5(schema, references) {
  return IsTransform(schema) || Visit13(schema.item, references);
}
function FromRecord10(schema, references) {
  const pattern2 = Object.getOwnPropertyNames(schema.patternProperties)[0];
  const property = schema.patternProperties[pattern2];
  return IsTransform(schema) || Visit13(property, references) || IsSchema(schema.additionalProperties) && IsTransform(schema.additionalProperties);
}
function FromRef10(schema, references) {
  if (IsTransform(schema))
    return true;
  return Visit13(Deref(schema, references), references);
}
function FromThis9(schema, references) {
  if (IsTransform(schema))
    return true;
  return Visit13(Deref(schema, references), references);
}
function FromTuple12(schema, references) {
  return IsTransform(schema) || !IsUndefined(schema.items) && schema.items.some((schema2) => Visit13(schema2, references));
}
function FromUnion14(schema, references) {
  return IsTransform(schema) || schema.anyOf.some((schema2) => Visit13(schema2, references));
}
function Visit13(schema, references) {
  const references_ = Pushref(schema, references);
  const schema_ = schema;
  if (schema.$id && visited.has(schema.$id))
    return false;
  if (schema.$id)
    visited.add(schema.$id);
  switch (schema[Kind]) {
    case "Array":
      return FromArray13(schema_, references_);
    case "AsyncIterator":
      return FromAsyncIterator5(schema_, references_);
    case "Constructor":
      return FromConstructor6(schema_, references_);
    case "Function":
      return FromFunction5(schema_, references_);
    case "Import":
      return FromImport9(schema_, references_);
    case "Intersect":
      return FromIntersect12(schema_, references_);
    case "Iterator":
      return FromIterator5(schema_, references_);
    case "Not":
      return FromNot7(schema_, references_);
    case "Object":
      return FromObject11(schema_, references_);
    case "Promise":
      return FromPromise5(schema_, references_);
    case "Record":
      return FromRecord10(schema_, references_);
    case "Ref":
      return FromRef10(schema_, references_);
    case "This":
      return FromThis9(schema_, references_);
    case "Tuple":
      return FromTuple12(schema_, references_);
    case "Union":
      return FromUnion14(schema_, references_);
    default:
      return IsTransform(schema);
  }
}
function HasTransform(schema, references) {
  visited.clear();
  return Visit13(schema, references);
}
var visited;
var init_has = __esm(() => {
  init_deref2();
  init_symbols2();
  init_kind();
  init_guard();
  visited = new Set;
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/transform/index.mjs
var init_transform = __esm(() => {
  init_decode();
  init_encode();
  init_has();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/decode/decode.mjs
function Decode(...args2) {
  const [schema, references, value] = args2.length === 3 ? [args2[0], args2[1], args2[2]] : [args2[0], [], args2[1]];
  if (!Check(schema, references, value))
    throw new TransformDecodeCheckError(schema, value, Errors(schema, references, value).First());
  return HasTransform(schema, references) ? TransformDecode(schema, references, value) : value;
}
var init_decode2 = __esm(() => {
  init_transform();
  init_check2();
  init_errors2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/decode/index.mjs
var init_decode3 = __esm(() => {
  init_decode2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/default/default.mjs
function ValueOrDefault(schema, value) {
  const defaultValue = HasPropertyKey(schema, "default") ? schema.default : undefined;
  const clone2 = IsFunction(defaultValue) ? defaultValue() : Clone2(defaultValue);
  return IsUndefined(value) ? clone2 : IsObject(value) && IsObject(clone2) ? Object.assign(clone2, value) : value;
}
function HasDefaultProperty(schema) {
  return IsKind(schema) && "default" in schema;
}
function FromArray14(schema, references, value) {
  if (IsArray(value)) {
    for (let i = 0;i < value.length; i++) {
      value[i] = Visit14(schema.items, references, value[i]);
    }
    return value;
  }
  const defaulted = ValueOrDefault(schema, value);
  if (!IsArray(defaulted))
    return defaulted;
  for (let i = 0;i < defaulted.length; i++) {
    defaulted[i] = Visit14(schema.items, references, defaulted[i]);
  }
  return defaulted;
}
function FromDate7(schema, references, value) {
  return IsDate(value) ? value : ValueOrDefault(schema, value);
}
function FromImport10(schema, references, value) {
  const definitions = globalThis.Object.values(schema.$defs);
  const target = schema.$defs[schema.$ref];
  return Visit14(target, [...references, ...definitions], value);
}
function FromIntersect13(schema, references, value) {
  const defaulted = ValueOrDefault(schema, value);
  return schema.allOf.reduce((acc, schema2) => {
    const next = Visit14(schema2, references, defaulted);
    return IsObject(next) ? { ...acc, ...next } : next;
  }, {});
}
function FromObject12(schema, references, value) {
  const defaulted = ValueOrDefault(schema, value);
  if (!IsObject(defaulted))
    return defaulted;
  const knownPropertyKeys = Object.getOwnPropertyNames(schema.properties);
  for (const key of knownPropertyKeys) {
    const propertyValue = Visit14(schema.properties[key], references, defaulted[key]);
    if (IsUndefined(propertyValue))
      continue;
    defaulted[key] = Visit14(schema.properties[key], references, defaulted[key]);
  }
  if (!HasDefaultProperty(schema.additionalProperties))
    return defaulted;
  for (const key of Object.getOwnPropertyNames(defaulted)) {
    if (knownPropertyKeys.includes(key))
      continue;
    defaulted[key] = Visit14(schema.additionalProperties, references, defaulted[key]);
  }
  return defaulted;
}
function FromRecord11(schema, references, value) {
  const defaulted = ValueOrDefault(schema, value);
  if (!IsObject(defaulted))
    return defaulted;
  const additionalPropertiesSchema = schema.additionalProperties;
  const [propertyKeyPattern, propertySchema] = Object.entries(schema.patternProperties)[0];
  const knownPropertyKey = new RegExp(propertyKeyPattern);
  for (const key of Object.getOwnPropertyNames(defaulted)) {
    if (!(knownPropertyKey.test(key) && HasDefaultProperty(propertySchema)))
      continue;
    defaulted[key] = Visit14(propertySchema, references, defaulted[key]);
  }
  if (!HasDefaultProperty(additionalPropertiesSchema))
    return defaulted;
  for (const key of Object.getOwnPropertyNames(defaulted)) {
    if (knownPropertyKey.test(key))
      continue;
    defaulted[key] = Visit14(additionalPropertiesSchema, references, defaulted[key]);
  }
  return defaulted;
}
function FromRef11(schema, references, value) {
  return Visit14(Deref(schema, references), references, ValueOrDefault(schema, value));
}
function FromThis10(schema, references, value) {
  return Visit14(Deref(schema, references), references, value);
}
function FromTuple13(schema, references, value) {
  const defaulted = ValueOrDefault(schema, value);
  if (!IsArray(defaulted) || IsUndefined(schema.items))
    return defaulted;
  const [items, max] = [schema.items, Math.max(schema.items.length, defaulted.length)];
  for (let i = 0;i < max; i++) {
    if (i < items.length)
      defaulted[i] = Visit14(items[i], references, defaulted[i]);
  }
  return defaulted;
}
function FromUnion15(schema, references, value) {
  const defaulted = ValueOrDefault(schema, value);
  for (const inner of schema.anyOf) {
    const result = Visit14(inner, references, Clone2(defaulted));
    if (Check(inner, references, result)) {
      return result;
    }
  }
  return defaulted;
}
function Visit14(schema, references, value) {
  const references_ = Pushref(schema, references);
  const schema_ = schema;
  switch (schema_[Kind]) {
    case "Array":
      return FromArray14(schema_, references_, value);
    case "Date":
      return FromDate7(schema_, references_, value);
    case "Import":
      return FromImport10(schema_, references_, value);
    case "Intersect":
      return FromIntersect13(schema_, references_, value);
    case "Object":
      return FromObject12(schema_, references_, value);
    case "Record":
      return FromRecord11(schema_, references_, value);
    case "Ref":
      return FromRef11(schema_, references_, value);
    case "This":
      return FromThis10(schema_, references_, value);
    case "Tuple":
      return FromTuple13(schema_, references_, value);
    case "Union":
      return FromUnion15(schema_, references_, value);
    default:
      return ValueOrDefault(schema_, value);
  }
}
function Default5(...args2) {
  return args2.length === 3 ? Visit14(args2[0], args2[1], args2[2]) : Visit14(args2[0], [], args2[1]);
}
var init_default = __esm(() => {
  init_check2();
  init_clone2();
  init_deref2();
  init_symbols2();
  init_guard();
  init_kind();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/default/index.mjs
var init_default2 = __esm(() => {
  init_default();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/pointer/pointer.mjs
var exports_pointer = {};
__export(exports_pointer, {
  ValuePointerRootSetError: () => ValuePointerRootSetError,
  ValuePointerRootDeleteError: () => ValuePointerRootDeleteError,
  Set: () => Set4,
  Has: () => Has3,
  Get: () => Get3,
  Format: () => Format,
  Delete: () => Delete3
});
function Escape2(component) {
  return component.indexOf("~") === -1 ? component : component.replace(/~1/g, "/").replace(/~0/g, "~");
}
function* Format(pointer) {
  if (pointer === "")
    return;
  let [start, end] = [0, 0];
  for (let i = 0;i < pointer.length; i++) {
    const char = pointer.charAt(i);
    if (char === "/") {
      if (i === 0) {
        start = i + 1;
      } else {
        end = i;
        yield Escape2(pointer.slice(start, end));
        start = i + 1;
      }
    } else {
      end = i;
    }
  }
  yield Escape2(pointer.slice(start));
}
function Set4(value, pointer, update) {
  if (pointer === "")
    throw new ValuePointerRootSetError(value, pointer, update);
  let [owner, next, key] = [null, value, ""];
  for (const component of Format(pointer)) {
    if (next[component] === undefined)
      next[component] = {};
    owner = next;
    next = next[component];
    key = component;
  }
  owner[key] = update;
}
function Delete3(value, pointer) {
  if (pointer === "")
    throw new ValuePointerRootDeleteError(value, pointer);
  let [owner, next, key] = [null, value, ""];
  for (const component of Format(pointer)) {
    if (next[component] === undefined || next[component] === null)
      return;
    owner = next;
    next = next[component];
    key = component;
  }
  if (Array.isArray(owner)) {
    const index = parseInt(key);
    owner.splice(index, 1);
  } else {
    delete owner[key];
  }
}
function Has3(value, pointer) {
  if (pointer === "")
    return true;
  let [owner, next, key] = [null, value, ""];
  for (const component of Format(pointer)) {
    if (next[component] === undefined)
      return false;
    owner = next;
    next = next[component];
    key = component;
  }
  return Object.getOwnPropertyNames(owner).includes(key);
}
function Get3(value, pointer) {
  if (pointer === "")
    return value;
  let current = value;
  for (const component of Format(pointer)) {
    if (current[component] === undefined)
      return;
    current = current[component];
  }
  return current;
}
var ValuePointerRootSetError, ValuePointerRootDeleteError;
var init_pointer = __esm(() => {
  init_error2();
  ValuePointerRootSetError = class ValuePointerRootSetError extends TypeBoxError {
    constructor(value, path, update) {
      super("Cannot set root value");
      this.value = value;
      this.path = path;
      this.update = update;
    }
  };
  ValuePointerRootDeleteError = class ValuePointerRootDeleteError extends TypeBoxError {
    constructor(value, path) {
      super("Cannot delete root value");
      this.value = value;
      this.path = path;
    }
  };
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/pointer/index.mjs
var init_pointer2 = __esm(() => {
  init_pointer();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/equal/equal.mjs
function ObjectType3(left, right) {
  if (!IsObject(right))
    return false;
  const leftKeys = [...Object.keys(left), ...Object.getOwnPropertySymbols(left)];
  const rightKeys = [...Object.keys(right), ...Object.getOwnPropertySymbols(right)];
  if (leftKeys.length !== rightKeys.length)
    return false;
  return leftKeys.every((key) => Equal(left[key], right[key]));
}
function DateType3(left, right) {
  return IsDate(right) && left.getTime() === right.getTime();
}
function ArrayType3(left, right) {
  if (!IsArray(right) || left.length !== right.length)
    return false;
  return left.every((value, index) => Equal(value, right[index]));
}
function TypedArrayType(left, right) {
  if (!IsTypedArray(right) || left.length !== right.length || Object.getPrototypeOf(left).constructor.name !== Object.getPrototypeOf(right).constructor.name)
    return false;
  return left.every((value, index) => Equal(value, right[index]));
}
function ValueType(left, right) {
  return left === right;
}
function Equal(left, right) {
  if (IsDate(left))
    return DateType3(left, right);
  if (IsTypedArray(left))
    return TypedArrayType(left, right);
  if (IsArray(left))
    return ArrayType3(left, right);
  if (IsObject(left))
    return ObjectType3(left, right);
  if (IsValueType(left))
    return ValueType(left, right);
  throw new Error("ValueEquals: Unable to compare value");
}
var init_equal = __esm(() => {
  init_guard();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/delta/delta.mjs
function CreateUpdate(path, value) {
  return { type: "update", path, value };
}
function CreateInsert(path, value) {
  return { type: "insert", path, value };
}
function CreateDelete(path) {
  return { type: "delete", path };
}
function AssertDiffable(value) {
  if (globalThis.Object.getOwnPropertySymbols(value).length > 0)
    throw new ValueDiffError(value, "Cannot diff objects with symbols");
}
function* ObjectType4(path, current, next) {
  AssertDiffable(current);
  AssertDiffable(next);
  if (!IsStandardObject(next))
    return yield CreateUpdate(path, next);
  const currentKeys = globalThis.Object.getOwnPropertyNames(current);
  const nextKeys = globalThis.Object.getOwnPropertyNames(next);
  for (const key of nextKeys) {
    if (HasPropertyKey(current, key))
      continue;
    yield CreateInsert(`${path}/${key}`, next[key]);
  }
  for (const key of currentKeys) {
    if (!HasPropertyKey(next, key))
      continue;
    if (Equal(current, next))
      continue;
    yield* Visit15(`${path}/${key}`, current[key], next[key]);
  }
  for (const key of currentKeys) {
    if (HasPropertyKey(next, key))
      continue;
    yield CreateDelete(`${path}/${key}`);
  }
}
function* ArrayType4(path, current, next) {
  if (!IsArray(next))
    return yield CreateUpdate(path, next);
  for (let i = 0;i < Math.min(current.length, next.length); i++) {
    yield* Visit15(`${path}/${i}`, current[i], next[i]);
  }
  for (let i = 0;i < next.length; i++) {
    if (i < current.length)
      continue;
    yield CreateInsert(`${path}/${i}`, next[i]);
  }
  for (let i = current.length - 1;i >= 0; i--) {
    if (i < next.length)
      continue;
    yield CreateDelete(`${path}/${i}`);
  }
}
function* TypedArrayType2(path, current, next) {
  if (!IsTypedArray(next) || current.length !== next.length || globalThis.Object.getPrototypeOf(current).constructor.name !== globalThis.Object.getPrototypeOf(next).constructor.name)
    return yield CreateUpdate(path, next);
  for (let i = 0;i < Math.min(current.length, next.length); i++) {
    yield* Visit15(`${path}/${i}`, current[i], next[i]);
  }
}
function* ValueType2(path, current, next) {
  if (current === next)
    return;
  yield CreateUpdate(path, next);
}
function* Visit15(path, current, next) {
  if (IsStandardObject(current))
    return yield* ObjectType4(path, current, next);
  if (IsArray(current))
    return yield* ArrayType4(path, current, next);
  if (IsTypedArray(current))
    return yield* TypedArrayType2(path, current, next);
  if (IsValueType(current))
    return yield* ValueType2(path, current, next);
  throw new ValueDiffError(current, "Unable to diff value");
}
function Diff(current, next) {
  return [...Visit15("", current, next)];
}
function IsRootUpdate(edits) {
  return edits.length > 0 && edits[0].path === "" && edits[0].type === "update";
}
function IsIdentity(edits) {
  return edits.length === 0;
}
function Patch(current, edits) {
  if (IsRootUpdate(edits)) {
    return Clone2(edits[0].value);
  }
  if (IsIdentity(edits)) {
    return Clone2(current);
  }
  const clone2 = Clone2(current);
  for (const edit of edits) {
    switch (edit.type) {
      case "insert": {
        exports_pointer.Set(clone2, edit.path, edit.value);
        break;
      }
      case "update": {
        exports_pointer.Set(clone2, edit.path, edit.value);
        break;
      }
      case "delete": {
        exports_pointer.Delete(clone2, edit.path);
        break;
      }
    }
  }
  return clone2;
}
var Insert, Update, Delete4, Edit, ValueDiffError;
var init_delta = __esm(() => {
  init_guard();
  init_pointer2();
  init_clone2();
  init_equal();
  init_error2();
  init_literal2();
  init_object2();
  init_string2();
  init_unknown2();
  init_union2();
  Insert = Object2({
    type: Literal("insert"),
    path: String2(),
    value: Unknown()
  });
  Update = Object2({
    type: Literal("update"),
    path: String2(),
    value: Unknown()
  });
  Delete4 = Object2({
    type: Literal("delete"),
    path: String2()
  });
  Edit = Union([Insert, Update, Delete4]);
  ValueDiffError = class ValueDiffError extends TypeBoxError {
    constructor(value, message2) {
      super(message2);
      this.value = value;
    }
  };
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/delta/index.mjs
var init_delta2 = __esm(() => {
  init_delta();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/encode/encode.mjs
function Encode(...args2) {
  const [schema, references, value] = args2.length === 3 ? [args2[0], args2[1], args2[2]] : [args2[0], [], args2[1]];
  const encoded = HasTransform(schema, references) ? TransformEncode(schema, references, value) : value;
  if (!Check(schema, references, encoded))
    throw new TransformEncodeCheckError(schema, encoded, Errors(schema, references, encoded).First());
  return encoded;
}
var init_encode2 = __esm(() => {
  init_transform();
  init_check2();
  init_errors2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/encode/index.mjs
var init_encode3 = __esm(() => {
  init_encode2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/equal/index.mjs
var init_equal2 = __esm(() => {
  init_equal();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/mutate/mutate.mjs
function IsStandardObject2(value) {
  return IsObject(value) && !IsArray(value);
}
function ObjectType5(root, path, current, next) {
  if (!IsStandardObject2(current)) {
    exports_pointer.Set(root, path, Clone2(next));
  } else {
    const currentKeys = Object.getOwnPropertyNames(current);
    const nextKeys = Object.getOwnPropertyNames(next);
    for (const currentKey of currentKeys) {
      if (!nextKeys.includes(currentKey)) {
        delete current[currentKey];
      }
    }
    for (const nextKey of nextKeys) {
      if (!currentKeys.includes(nextKey)) {
        current[nextKey] = null;
      }
    }
    for (const nextKey of nextKeys) {
      Visit16(root, `${path}/${nextKey}`, current[nextKey], next[nextKey]);
    }
  }
}
function ArrayType5(root, path, current, next) {
  if (!IsArray(current)) {
    exports_pointer.Set(root, path, Clone2(next));
  } else {
    for (let index = 0;index < next.length; index++) {
      Visit16(root, `${path}/${index}`, current[index], next[index]);
    }
    current.splice(next.length);
  }
}
function TypedArrayType3(root, path, current, next) {
  if (IsTypedArray(current) && current.length === next.length) {
    for (let i = 0;i < current.length; i++) {
      current[i] = next[i];
    }
  } else {
    exports_pointer.Set(root, path, Clone2(next));
  }
}
function ValueType3(root, path, current, next) {
  if (current === next)
    return;
  exports_pointer.Set(root, path, next);
}
function Visit16(root, path, current, next) {
  if (IsArray(next))
    return ArrayType5(root, path, current, next);
  if (IsTypedArray(next))
    return TypedArrayType3(root, path, current, next);
  if (IsStandardObject2(next))
    return ObjectType5(root, path, current, next);
  if (IsValueType(next))
    return ValueType3(root, path, current, next);
}
function IsNonMutableValue(value) {
  return IsTypedArray(value) || IsValueType(value);
}
function IsMismatchedValue(current, next) {
  return IsStandardObject2(current) && IsArray(next) || IsArray(current) && IsStandardObject2(next);
}
function Mutate(current, next) {
  if (IsNonMutableValue(current) || IsNonMutableValue(next))
    throw new ValueMutateError("Only object and array types can be mutated at the root level");
  if (IsMismatchedValue(current, next))
    throw new ValueMutateError("Cannot assign due type mismatch of assignable values");
  Visit16(current, "", current, next);
}
var ValueMutateError;
var init_mutate = __esm(() => {
  init_guard();
  init_pointer2();
  init_clone2();
  init_error2();
  ValueMutateError = class ValueMutateError extends TypeBoxError {
    constructor(message2) {
      super(message2);
    }
  };
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/mutate/index.mjs
var init_mutate2 = __esm(() => {
  init_mutate();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/parse/parse.mjs
function ParseValue(operations, type2, references, value) {
  return operations.reduce((value2, operationKey) => {
    const operation = ParseRegistry.Get(operationKey);
    if (IsUndefined(operation))
      throw new ParseError(`Unable to find Parse operation '${operationKey}'`);
    return operation(type2, references, value2);
  }, value);
}
function Parse(...args2) {
  const [operations, schema, references, value] = args2.length === 4 ? [args2[0], args2[1], args2[2], args2[3]] : args2.length === 3 ? IsArray(args2[0]) ? [args2[0], args2[1], [], args2[2]] : [ParseDefault, args2[0], args2[1], args2[2]] : args2.length === 2 ? [ParseDefault, args2[0], [], args2[1]] : (() => {
    throw new ParseError("Invalid Arguments");
  })();
  return ParseValue(operations, schema, references, value);
}
var ParseError, ParseRegistry, ParseDefault;
var init_parse2 = __esm(() => {
  init_error2();
  init_transform();
  init_assert2();
  init_cast2();
  init_clean2();
  init_clone2();
  init_convert2();
  init_default2();
  init_guard();
  ParseError = class ParseError extends TypeBoxError {
    constructor(message2) {
      super(message2);
    }
  };
  (function(ParseRegistry2) {
    const registry = new Map([
      ["Assert", (type2, references, value) => {
        Assert(type2, references, value);
        return value;
      }],
      ["Cast", (type2, references, value) => Cast(type2, references, value)],
      ["Clean", (type2, references, value) => Clean(type2, references, value)],
      ["Clone", (_type, _references, value) => Clone2(value)],
      ["Convert", (type2, references, value) => Convert(type2, references, value)],
      ["Decode", (type2, references, value) => HasTransform(type2, references) ? TransformDecode(type2, references, value) : value],
      ["Default", (type2, references, value) => Default5(type2, references, value)],
      ["Encode", (type2, references, value) => HasTransform(type2, references) ? TransformEncode(type2, references, value) : value]
    ]);
    function Delete5(key) {
      registry.delete(key);
    }
    ParseRegistry2.Delete = Delete5;
    function Set5(key, callback) {
      registry.set(key, callback);
    }
    ParseRegistry2.Set = Set5;
    function Get4(key) {
      return registry.get(key);
    }
    ParseRegistry2.Get = Get4;
  })(ParseRegistry || (ParseRegistry = {}));
  ParseDefault = [
    "Clone",
    "Clean",
    "Default",
    "Convert",
    "Assert",
    "Decode"
  ];
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/parse/index.mjs
var init_parse3 = __esm(() => {
  init_parse2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/value/value.mjs
var exports_value2 = {};
__export(exports_value2, {
  ValueErrorIterator: () => ValueErrorIterator,
  Patch: () => Patch,
  Parse: () => Parse,
  Mutate: () => Mutate,
  Hash: () => Hash,
  Errors: () => Errors,
  Equal: () => Equal,
  Encode: () => Encode,
  Edit: () => Edit,
  Diff: () => Diff,
  Default: () => Default5,
  Decode: () => Decode,
  Create: () => Create2,
  Convert: () => Convert,
  Clone: () => Clone2,
  Clean: () => Clean,
  Check: () => Check,
  Cast: () => Cast,
  Assert: () => Assert
});
var init_value2 = __esm(() => {
  init_errors2();
  init_assert2();
  init_cast2();
  init_check2();
  init_clean2();
  init_clone2();
  init_convert2();
  init_create3();
  init_decode3();
  init_default2();
  init_delta2();
  init_encode3();
  init_equal2();
  init_hash2();
  init_mutate2();
  init_parse3();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/value/index.mjs
var init_value3 = __esm(() => {
  init_value2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/value/index.mjs
var init_value4 = __esm(() => {
  init_value3();
  init_guard();
  init_assert2();
  init_cast2();
  init_check2();
  init_clean2();
  init_clone2();
  init_convert2();
  init_create3();
  init_decode3();
  init_default2();
  init_delta2();
  init_encode3();
  init_equal2();
  init_hash2();
  init_mutate2();
  init_parse3();
  init_pointer2();
  init_transform();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/clone/type.mjs
function CloneType(schema, options) {
  return options === undefined ? Clone(schema) : Clone({ ...options, ...schema });
}
var init_type4 = __esm(() => {
  init_value();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/clone/index.mjs
var init_clone3 = __esm(() => {
  init_type4();
  init_value();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/helpers/index.mjs
var init_helpers = () => {};

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/argument/argument.mjs
function Argument(index) {
  return CreateType({ [Kind]: "Argument", index });
}
var init_argument = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/argument/index.mjs
var init_argument2 = __esm(() => {
  init_argument();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/awaited/awaited.mjs
function FromComputed2(target, parameters) {
  return Computed("Awaited", [Computed(target, parameters)]);
}
function FromRef12($ref) {
  return Computed("Awaited", [Ref($ref)]);
}
function FromIntersect14(types) {
  return Intersect(FromRest4(types));
}
function FromUnion16(types) {
  return Union(FromRest4(types));
}
function FromPromise6(type3) {
  return Awaited(type3);
}
function FromRest4(types) {
  return types.map((type3) => Awaited(type3));
}
function Awaited(type3, options) {
  return CreateType(IsComputed(type3) ? FromComputed2(type3.target, type3.parameters) : IsIntersect(type3) ? FromIntersect14(type3.allOf) : IsUnion(type3) ? FromUnion16(type3.anyOf) : IsPromise2(type3) ? FromPromise6(type3.item) : IsRef(type3) ? FromRef12(type3.$ref) : type3, options);
}
var init_awaited = __esm(() => {
  init_type2();
  init_computed2();
  init_intersect2();
  init_union2();
  init_ref2();
  init_kind();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/awaited/index.mjs
var init_awaited2 = __esm(() => {
  init_awaited();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/composite/composite.mjs
function CompositeKeys(T) {
  const Acc = [];
  for (const L of T)
    Acc.push(...KeyOfPropertyKeys(L));
  return SetDistinct(Acc);
}
function FilterNever(T) {
  return T.filter((L) => !IsNever(L));
}
function CompositeProperty(T, K) {
  const Acc = [];
  for (const L of T)
    Acc.push(...IndexFromPropertyKeys(L, [K]));
  return FilterNever(Acc);
}
function CompositeProperties(T, K) {
  const Acc = {};
  for (const L of K) {
    Acc[L] = IntersectEvaluated(CompositeProperty(T, L));
  }
  return Acc;
}
function Composite(T, options) {
  const K = CompositeKeys(T);
  const P = CompositeProperties(T, K);
  const R = Object2(P, options);
  return R;
}
var init_composite = __esm(() => {
  init_intersect2();
  init_indexed2();
  init_keyof2();
  init_object2();
  init_sets();
  init_kind();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/composite/index.mjs
var init_composite2 = __esm(() => {
  init_composite();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/date/date.mjs
function Date2(options) {
  return CreateType({ [Kind]: "Date", type: "Date" }, options);
}
var init_date = __esm(() => {
  init_symbols2();
  init_type2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/date/index.mjs
var init_date2 = __esm(() => {
  init_date();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/null/null.mjs
function Null(options) {
  return CreateType({ [Kind]: "Null", type: "null" }, options);
}
var init_null = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/null/index.mjs
var init_null2 = __esm(() => {
  init_null();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/symbol/symbol.mjs
function Symbol2(options) {
  return CreateType({ [Kind]: "Symbol", type: "symbol" }, options);
}
var init_symbol = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/symbol/index.mjs
var init_symbol2 = __esm(() => {
  init_symbol();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/undefined/undefined.mjs
function Undefined(options) {
  return CreateType({ [Kind]: "Undefined", type: "undefined" }, options);
}
var init_undefined = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/undefined/index.mjs
var init_undefined2 = __esm(() => {
  init_undefined();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/uint8array/uint8array.mjs
function Uint8Array2(options) {
  return CreateType({ [Kind]: "Uint8Array", type: "Uint8Array" }, options);
}
var init_uint8array = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/uint8array/index.mjs
var init_uint8array2 = __esm(() => {
  init_uint8array();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/const/const.mjs
function FromArray15(T) {
  return T.map((L) => FromValue2(L, false));
}
function FromProperties8(value2) {
  const Acc = {};
  for (const K of globalThis.Object.getOwnPropertyNames(value2))
    Acc[K] = Readonly(FromValue2(value2[K], false));
  return Acc;
}
function ConditionalReadonly(T, root) {
  return root === true ? T : Readonly(T);
}
function FromValue2(value2, root) {
  return IsAsyncIterator2(value2) ? ConditionalReadonly(Any(), root) : IsIterator2(value2) ? ConditionalReadonly(Any(), root) : IsArray2(value2) ? Readonly(Tuple(FromArray15(value2))) : IsUint8Array2(value2) ? Uint8Array2() : IsDate2(value2) ? Date2() : IsObject2(value2) ? ConditionalReadonly(Object2(FromProperties8(value2)), root) : IsFunction2(value2) ? ConditionalReadonly(Function2([], Unknown()), root) : IsUndefined2(value2) ? Undefined() : IsNull2(value2) ? Null() : IsSymbol2(value2) ? Symbol2() : IsBigInt2(value2) ? BigInt2() : IsNumber2(value2) ? Literal(value2) : IsBoolean2(value2) ? Literal(value2) : IsString2(value2) ? Literal(value2) : Object2({});
}
function Const(T, options) {
  return CreateType(FromValue2(T, true), options);
}
var init_const = __esm(() => {
  init_any2();
  init_bigint2();
  init_date2();
  init_function2();
  init_literal2();
  init_null2();
  init_object2();
  init_symbol2();
  init_tuple2();
  init_readonly2();
  init_undefined2();
  init_uint8array2();
  init_unknown2();
  init_create();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/const/index.mjs
var init_const2 = __esm(() => {
  init_const();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/constructor-parameters/constructor-parameters.mjs
function ConstructorParameters(schema, options) {
  return IsConstructor(schema) ? Tuple(schema.parameters, options) : Never(options);
}
var init_constructor_parameters = __esm(() => {
  init_tuple2();
  init_never2();
  init_kind();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/constructor-parameters/index.mjs
var init_constructor_parameters2 = __esm(() => {
  init_constructor_parameters();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/enum/enum.mjs
function Enum(item, options) {
  if (IsUndefined2(item))
    throw new Error("Enum undefined or empty");
  const values1 = globalThis.Object.getOwnPropertyNames(item).filter((key) => isNaN(key)).map((key) => item[key]);
  const values2 = [...new Set(values1)];
  const anyOf = values2.map((value2) => Literal(value2));
  return Union(anyOf, { ...options, [Hint]: "Enum" });
}
var init_enum = __esm(() => {
  init_literal2();
  init_symbols2();
  init_union2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/enum/index.mjs
var init_enum2 = __esm(() => {
  init_enum();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/exclude/exclude-from-template-literal.mjs
function ExcludeFromTemplateLiteral(L, R) {
  return Exclude(TemplateLiteralToUnion(L), R);
}
var init_exclude_from_template_literal = __esm(() => {
  init_exclude();
  init_template_literal2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/exclude/exclude.mjs
function ExcludeRest(L, R) {
  const excluded = L.filter((inner) => ExtendsCheck(inner, R) === ExtendsResult.False);
  return excluded.length === 1 ? excluded[0] : Union(excluded);
}
function Exclude(L, R, options = {}) {
  if (IsTemplateLiteral(L))
    return CreateType(ExcludeFromTemplateLiteral(L, R), options);
  if (IsMappedResult(L))
    return CreateType(ExcludeFromMappedResult(L, R), options);
  return CreateType(IsUnion(L) ? ExcludeRest(L.anyOf, R) : ExtendsCheck(L, R) !== ExtendsResult.False ? Never() : L, options);
}
var init_exclude = __esm(() => {
  init_type2();
  init_union2();
  init_never2();
  init_extends2();
  init_exclude_from_mapped_result();
  init_exclude_from_template_literal();
  init_kind();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/exclude/exclude-from-mapped-result.mjs
function FromProperties9(P, U) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(P))
    Acc[K2] = Exclude(P[K2], U);
  return Acc;
}
function FromMappedResult7(R, T) {
  return FromProperties9(R.properties, T);
}
function ExcludeFromMappedResult(R, T) {
  const P = FromMappedResult7(R, T);
  return MappedResult(P);
}
var init_exclude_from_mapped_result = __esm(() => {
  init_mapped2();
  init_exclude();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/exclude/index.mjs
var init_exclude2 = __esm(() => {
  init_exclude_from_mapped_result();
  init_exclude_from_template_literal();
  init_exclude();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/extract/extract-from-template-literal.mjs
function ExtractFromTemplateLiteral(L, R) {
  return Extract(TemplateLiteralToUnion(L), R);
}
var init_extract_from_template_literal = __esm(() => {
  init_extract();
  init_template_literal2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/extract/extract.mjs
function ExtractRest(L, R) {
  const extracted = L.filter((inner) => ExtendsCheck(inner, R) !== ExtendsResult.False);
  return extracted.length === 1 ? extracted[0] : Union(extracted);
}
function Extract(L, R, options) {
  if (IsTemplateLiteral(L))
    return CreateType(ExtractFromTemplateLiteral(L, R), options);
  if (IsMappedResult(L))
    return CreateType(ExtractFromMappedResult(L, R), options);
  return CreateType(IsUnion(L) ? ExtractRest(L.anyOf, R) : ExtendsCheck(L, R) !== ExtendsResult.False ? L : Never(), options);
}
var init_extract = __esm(() => {
  init_type2();
  init_union2();
  init_never2();
  init_extends2();
  init_extract_from_mapped_result();
  init_extract_from_template_literal();
  init_kind();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/extract/extract-from-mapped-result.mjs
function FromProperties10(P, T) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(P))
    Acc[K2] = Extract(P[K2], T);
  return Acc;
}
function FromMappedResult8(R, T) {
  return FromProperties10(R.properties, T);
}
function ExtractFromMappedResult(R, T) {
  const P = FromMappedResult8(R, T);
  return MappedResult(P);
}
var init_extract_from_mapped_result = __esm(() => {
  init_mapped2();
  init_extract();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/extract/index.mjs
var init_extract2 = __esm(() => {
  init_extract_from_mapped_result();
  init_extract_from_template_literal();
  init_extract();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/instance-type/instance-type.mjs
function InstanceType(schema, options) {
  return IsConstructor(schema) ? CreateType(schema.returns, options) : Never(options);
}
var init_instance_type = __esm(() => {
  init_type2();
  init_never2();
  init_kind();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/instance-type/index.mjs
var init_instance_type2 = __esm(() => {
  init_instance_type();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/readonly-optional/readonly-optional.mjs
function ReadonlyOptional(schema) {
  return Readonly(Optional(schema));
}
var init_readonly_optional = __esm(() => {
  init_readonly2();
  init_optional2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/readonly-optional/index.mjs
var init_readonly_optional2 = __esm(() => {
  init_readonly_optional();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/record/record.mjs
function RecordCreateFromPattern(pattern2, T, options) {
  return CreateType({ [Kind]: "Record", type: "object", patternProperties: { [pattern2]: T } }, options);
}
function RecordCreateFromKeys(K, T, options) {
  const result = {};
  for (const K2 of K)
    result[K2] = T;
  return Object2(result, { ...options, [Hint]: "Record" });
}
function FromTemplateLiteralKey(K, T, options) {
  return IsTemplateLiteralFinite(K) ? RecordCreateFromKeys(IndexPropertyKeys(K), T, options) : RecordCreateFromPattern(K.pattern, T, options);
}
function FromUnionKey(key, type3, options) {
  return RecordCreateFromKeys(IndexPropertyKeys(Union(key)), type3, options);
}
function FromLiteralKey(key, type3, options) {
  return RecordCreateFromKeys([key.toString()], type3, options);
}
function FromRegExpKey(key, type3, options) {
  return RecordCreateFromPattern(key.source, type3, options);
}
function FromStringKey(key, type3, options) {
  const pattern2 = IsUndefined2(key.pattern) ? PatternStringExact : key.pattern;
  return RecordCreateFromPattern(pattern2, type3, options);
}
function FromAnyKey(_, type3, options) {
  return RecordCreateFromPattern(PatternStringExact, type3, options);
}
function FromNeverKey(_key, type3, options) {
  return RecordCreateFromPattern(PatternNeverExact, type3, options);
}
function FromBooleanKey(_key, type3, options) {
  return Object2({ true: type3, false: type3 }, options);
}
function FromIntegerKey(_key, type3, options) {
  return RecordCreateFromPattern(PatternNumberExact, type3, options);
}
function FromNumberKey(_, type3, options) {
  return RecordCreateFromPattern(PatternNumberExact, type3, options);
}
function Record(key, type3, options = {}) {
  return IsUnion(key) ? FromUnionKey(key.anyOf, type3, options) : IsTemplateLiteral(key) ? FromTemplateLiteralKey(key, type3, options) : IsLiteral(key) ? FromLiteralKey(key.const, type3, options) : IsBoolean3(key) ? FromBooleanKey(key, type3, options) : IsInteger2(key) ? FromIntegerKey(key, type3, options) : IsNumber3(key) ? FromNumberKey(key, type3, options) : IsRegExp2(key) ? FromRegExpKey(key, type3, options) : IsString3(key) ? FromStringKey(key, type3, options) : IsAny(key) ? FromAnyKey(key, type3, options) : IsNever(key) ? FromNeverKey(key, type3, options) : Never(options);
}
function RecordPattern(record) {
  return globalThis.Object.getOwnPropertyNames(record.patternProperties)[0];
}
function RecordKey2(type3) {
  const pattern2 = RecordPattern(type3);
  return pattern2 === PatternStringExact ? String2() : pattern2 === PatternNumberExact ? Number2() : String2({ pattern: pattern2 });
}
function RecordValue2(type3) {
  return type3.patternProperties[RecordPattern(type3)];
}
var init_record = __esm(() => {
  init_type2();
  init_symbols2();
  init_never2();
  init_number2();
  init_object2();
  init_string2();
  init_union2();
  init_template_literal2();
  init_patterns2();
  init_indexed2();
  init_kind();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/record/index.mjs
var init_record2 = __esm(() => {
  init_record();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/instantiate/instantiate.mjs
function FromConstructor7(args2, type3) {
  type3.parameters = FromTypes(args2, type3.parameters);
  type3.returns = FromType(args2, type3.returns);
  return type3;
}
function FromFunction6(args2, type3) {
  type3.parameters = FromTypes(args2, type3.parameters);
  type3.returns = FromType(args2, type3.returns);
  return type3;
}
function FromIntersect15(args2, type3) {
  type3.allOf = FromTypes(args2, type3.allOf);
  return type3;
}
function FromUnion17(args2, type3) {
  type3.anyOf = FromTypes(args2, type3.anyOf);
  return type3;
}
function FromTuple14(args2, type3) {
  if (IsUndefined2(type3.items))
    return type3;
  type3.items = FromTypes(args2, type3.items);
  return type3;
}
function FromArray16(args2, type3) {
  type3.items = FromType(args2, type3.items);
  return type3;
}
function FromAsyncIterator6(args2, type3) {
  type3.items = FromType(args2, type3.items);
  return type3;
}
function FromIterator6(args2, type3) {
  type3.items = FromType(args2, type3.items);
  return type3;
}
function FromPromise7(args2, type3) {
  type3.item = FromType(args2, type3.item);
  return type3;
}
function FromObject13(args2, type3) {
  const mappedProperties = FromProperties11(args2, type3.properties);
  return { ...type3, ...Object2(mappedProperties) };
}
function FromRecord12(args2, type3) {
  const mappedKey = FromType(args2, RecordKey2(type3));
  const mappedValue = FromType(args2, RecordValue2(type3));
  const result = Record(mappedKey, mappedValue);
  return { ...type3, ...result };
}
function FromArgument4(args2, argument2) {
  return argument2.index in args2 ? args2[argument2.index] : Unknown();
}
function FromProperty2(args2, type3) {
  const isReadonly = IsReadonly(type3);
  const isOptional = IsOptional(type3);
  const mapped2 = FromType(args2, type3);
  return isReadonly && isOptional ? ReadonlyOptional(mapped2) : isReadonly && !isOptional ? Readonly(mapped2) : !isReadonly && isOptional ? Optional(mapped2) : mapped2;
}
function FromProperties11(args2, properties) {
  return globalThis.Object.getOwnPropertyNames(properties).reduce((result, key) => {
    return { ...result, [key]: FromProperty2(args2, properties[key]) };
  }, {});
}
function FromTypes(args2, types) {
  return types.map((type3) => FromType(args2, type3));
}
function FromType(args2, type3) {
  return IsConstructor(type3) ? FromConstructor7(args2, type3) : IsFunction3(type3) ? FromFunction6(args2, type3) : IsIntersect(type3) ? FromIntersect15(args2, type3) : IsUnion(type3) ? FromUnion17(args2, type3) : IsTuple(type3) ? FromTuple14(args2, type3) : IsArray3(type3) ? FromArray16(args2, type3) : IsAsyncIterator3(type3) ? FromAsyncIterator6(args2, type3) : IsIterator3(type3) ? FromIterator6(args2, type3) : IsPromise2(type3) ? FromPromise7(args2, type3) : IsObject3(type3) ? FromObject13(args2, type3) : IsRecord(type3) ? FromRecord12(args2, type3) : IsArgument(type3) ? FromArgument4(args2, type3) : type3;
}
function Instantiate(type3, args2) {
  return FromType(args2, CloneType(type3));
}
var init_instantiate = __esm(() => {
  init_type4();
  init_unknown2();
  init_readonly_optional2();
  init_readonly2();
  init_optional2();
  init_object2();
  init_record2();
  init_kind();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/instantiate/index.mjs
var init_instantiate2 = __esm(() => {
  init_instantiate();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/integer/integer.mjs
function Integer(options) {
  return CreateType({ [Kind]: "Integer", type: "integer" }, options);
}
var init_integer = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/integer/index.mjs
var init_integer2 = __esm(() => {
  init_integer();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/intrinsic/intrinsic-from-mapped-key.mjs
function MappedIntrinsicPropertyKey(K, M, options) {
  return {
    [K]: Intrinsic(Literal(K), M, Clone(options))
  };
}
function MappedIntrinsicPropertyKeys(K, M, options) {
  const result = K.reduce((Acc, L) => {
    return { ...Acc, ...MappedIntrinsicPropertyKey(L, M, options) };
  }, {});
  return result;
}
function MappedIntrinsicProperties(T, M, options) {
  return MappedIntrinsicPropertyKeys(T["keys"], M, options);
}
function IntrinsicFromMappedKey(T, M, options) {
  const P = MappedIntrinsicProperties(T, M, options);
  return MappedResult(P);
}
var init_intrinsic_from_mapped_key = __esm(() => {
  init_mapped2();
  init_intrinsic();
  init_literal2();
  init_value();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/intrinsic/intrinsic.mjs
function ApplyUncapitalize(value2) {
  const [first, rest] = [value2.slice(0, 1), value2.slice(1)];
  return [first.toLowerCase(), rest].join("");
}
function ApplyCapitalize(value2) {
  const [first, rest] = [value2.slice(0, 1), value2.slice(1)];
  return [first.toUpperCase(), rest].join("");
}
function ApplyUppercase(value2) {
  return value2.toUpperCase();
}
function ApplyLowercase(value2) {
  return value2.toLowerCase();
}
function FromTemplateLiteral6(schema, mode, options) {
  const expression = TemplateLiteralParseExact(schema.pattern);
  const finite2 = IsTemplateLiteralExpressionFinite(expression);
  if (!finite2)
    return { ...schema, pattern: FromLiteralValue(schema.pattern, mode) };
  const strings = [...TemplateLiteralExpressionGenerate(expression)];
  const literals = strings.map((value2) => Literal(value2));
  const mapped2 = FromRest5(literals, mode);
  const union3 = Union(mapped2);
  return TemplateLiteral([union3], options);
}
function FromLiteralValue(value2, mode) {
  return typeof value2 === "string" ? mode === "Uncapitalize" ? ApplyUncapitalize(value2) : mode === "Capitalize" ? ApplyCapitalize(value2) : mode === "Uppercase" ? ApplyUppercase(value2) : mode === "Lowercase" ? ApplyLowercase(value2) : value2 : value2.toString();
}
function FromRest5(T, M) {
  return T.map((L) => Intrinsic(L, M));
}
function Intrinsic(schema, mode, options = {}) {
  return IsMappedKey(schema) ? IntrinsicFromMappedKey(schema, mode, options) : IsTemplateLiteral(schema) ? FromTemplateLiteral6(schema, mode, options) : IsUnion(schema) ? Union(FromRest5(schema.anyOf, mode), options) : IsLiteral(schema) ? Literal(FromLiteralValue(schema.const, mode), options) : CreateType(schema, options);
}
var init_intrinsic = __esm(() => {
  init_type2();
  init_template_literal2();
  init_intrinsic_from_mapped_key();
  init_literal2();
  init_union2();
  init_kind();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/intrinsic/capitalize.mjs
function Capitalize(T, options = {}) {
  return Intrinsic(T, "Capitalize", options);
}
var init_capitalize = __esm(() => {
  init_intrinsic();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/intrinsic/lowercase.mjs
function Lowercase(T, options = {}) {
  return Intrinsic(T, "Lowercase", options);
}
var init_lowercase = __esm(() => {
  init_intrinsic();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/intrinsic/uncapitalize.mjs
function Uncapitalize(T, options = {}) {
  return Intrinsic(T, "Uncapitalize", options);
}
var init_uncapitalize = __esm(() => {
  init_intrinsic();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/intrinsic/uppercase.mjs
function Uppercase(T, options = {}) {
  return Intrinsic(T, "Uppercase", options);
}
var init_uppercase = __esm(() => {
  init_intrinsic();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/intrinsic/index.mjs
var init_intrinsic2 = __esm(() => {
  init_capitalize();
  init_intrinsic_from_mapped_key();
  init_intrinsic();
  init_lowercase();
  init_uncapitalize();
  init_uppercase();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/omit/omit-from-mapped-result.mjs
function FromProperties12(properties, propertyKeys, options) {
  const result = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(properties))
    result[K2] = Omit(properties[K2], propertyKeys, Clone(options));
  return result;
}
function FromMappedResult9(mappedResult, propertyKeys, options) {
  return FromProperties12(mappedResult.properties, propertyKeys, options);
}
function OmitFromMappedResult(mappedResult, propertyKeys, options) {
  const properties = FromMappedResult9(mappedResult, propertyKeys, options);
  return MappedResult(properties);
}
var init_omit_from_mapped_result = __esm(() => {
  init_mapped2();
  init_omit();
  init_value();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/omit/omit.mjs
function FromIntersect16(types, propertyKeys) {
  return types.map((type3) => OmitResolve(type3, propertyKeys));
}
function FromUnion18(types, propertyKeys) {
  return types.map((type3) => OmitResolve(type3, propertyKeys));
}
function FromProperty3(properties, key) {
  const { [key]: _, ...R } = properties;
  return R;
}
function FromProperties13(properties, propertyKeys) {
  return propertyKeys.reduce((T, K2) => FromProperty3(T, K2), properties);
}
function FromObject14(type3, propertyKeys, properties) {
  const options = Discard(type3, [TransformKind, "$id", "required", "properties"]);
  const mappedProperties = FromProperties13(properties, propertyKeys);
  return Object2(mappedProperties, options);
}
function UnionFromPropertyKeys(propertyKeys) {
  const result = propertyKeys.reduce((result2, key) => IsLiteralValue(key) ? [...result2, Literal(key)] : result2, []);
  return Union(result);
}
function OmitResolve(type3, propertyKeys) {
  return IsIntersect(type3) ? Intersect(FromIntersect16(type3.allOf, propertyKeys)) : IsUnion(type3) ? Union(FromUnion18(type3.anyOf, propertyKeys)) : IsObject3(type3) ? FromObject14(type3, propertyKeys, type3.properties) : Object2({});
}
function Omit(type3, key, options) {
  const typeKey = IsArray2(key) ? UnionFromPropertyKeys(key) : key;
  const propertyKeys = IsSchema(key) ? IndexPropertyKeys(key) : key;
  const isTypeRef = IsRef(type3);
  const isKeyRef = IsRef(key);
  return IsMappedResult(type3) ? OmitFromMappedResult(type3, propertyKeys, options) : IsMappedKey(key) ? OmitFromMappedKey(type3, key, options) : isTypeRef && isKeyRef ? Computed("Omit", [type3, typeKey], options) : !isTypeRef && isKeyRef ? Computed("Omit", [type3, typeKey], options) : isTypeRef && !isKeyRef ? Computed("Omit", [type3, typeKey], options) : CreateType({ ...OmitResolve(type3, propertyKeys), ...options });
}
var init_omit = __esm(() => {
  init_type2();
  init_symbols();
  init_computed2();
  init_literal2();
  init_indexed2();
  init_intersect2();
  init_union2();
  init_object2();
  init_omit_from_mapped_key();
  init_omit_from_mapped_result();
  init_kind();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/omit/omit-from-mapped-key.mjs
function FromPropertyKey2(type3, key, options) {
  return { [key]: Omit(type3, [key], Clone(options)) };
}
function FromPropertyKeys2(type3, propertyKeys, options) {
  return propertyKeys.reduce((Acc, LK) => {
    return { ...Acc, ...FromPropertyKey2(type3, LK, options) };
  }, {});
}
function FromMappedKey3(type3, mappedKey, options) {
  return FromPropertyKeys2(type3, mappedKey.keys, options);
}
function OmitFromMappedKey(type3, mappedKey, options) {
  const properties = FromMappedKey3(type3, mappedKey, options);
  return MappedResult(properties);
}
var init_omit_from_mapped_key = __esm(() => {
  init_mapped2();
  init_omit();
  init_value();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/omit/index.mjs
var init_omit2 = __esm(() => {
  init_omit_from_mapped_key();
  init_omit_from_mapped_result();
  init_omit();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/pick/pick-from-mapped-result.mjs
function FromProperties14(properties, propertyKeys, options) {
  const result = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(properties))
    result[K2] = Pick(properties[K2], propertyKeys, Clone(options));
  return result;
}
function FromMappedResult10(mappedResult, propertyKeys, options) {
  return FromProperties14(mappedResult.properties, propertyKeys, options);
}
function PickFromMappedResult(mappedResult, propertyKeys, options) {
  const properties = FromMappedResult10(mappedResult, propertyKeys, options);
  return MappedResult(properties);
}
var init_pick_from_mapped_result = __esm(() => {
  init_mapped2();
  init_pick();
  init_value();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/pick/pick.mjs
function FromIntersect17(types, propertyKeys) {
  return types.map((type3) => PickResolve(type3, propertyKeys));
}
function FromUnion19(types, propertyKeys) {
  return types.map((type3) => PickResolve(type3, propertyKeys));
}
function FromProperties15(properties, propertyKeys) {
  const result = {};
  for (const K2 of propertyKeys)
    if (K2 in properties)
      result[K2] = properties[K2];
  return result;
}
function FromObject15(Type, keys, properties) {
  const options = Discard(Type, [TransformKind, "$id", "required", "properties"]);
  const mappedProperties = FromProperties15(properties, keys);
  return Object2(mappedProperties, options);
}
function UnionFromPropertyKeys2(propertyKeys) {
  const result = propertyKeys.reduce((result2, key) => IsLiteralValue(key) ? [...result2, Literal(key)] : result2, []);
  return Union(result);
}
function PickResolve(type3, propertyKeys) {
  return IsIntersect(type3) ? Intersect(FromIntersect17(type3.allOf, propertyKeys)) : IsUnion(type3) ? Union(FromUnion19(type3.anyOf, propertyKeys)) : IsObject3(type3) ? FromObject15(type3, propertyKeys, type3.properties) : Object2({});
}
function Pick(type3, key, options) {
  const typeKey = IsArray2(key) ? UnionFromPropertyKeys2(key) : key;
  const propertyKeys = IsSchema(key) ? IndexPropertyKeys(key) : key;
  const isTypeRef = IsRef(type3);
  const isKeyRef = IsRef(key);
  return IsMappedResult(type3) ? PickFromMappedResult(type3, propertyKeys, options) : IsMappedKey(key) ? PickFromMappedKey(type3, key, options) : isTypeRef && isKeyRef ? Computed("Pick", [type3, typeKey], options) : !isTypeRef && isKeyRef ? Computed("Pick", [type3, typeKey], options) : isTypeRef && !isKeyRef ? Computed("Pick", [type3, typeKey], options) : CreateType({ ...PickResolve(type3, propertyKeys), ...options });
}
var init_pick = __esm(() => {
  init_type2();
  init_computed2();
  init_intersect2();
  init_literal2();
  init_object2();
  init_union2();
  init_indexed2();
  init_symbols();
  init_kind();
  init_pick_from_mapped_key();
  init_pick_from_mapped_result();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/pick/pick-from-mapped-key.mjs
function FromPropertyKey3(type3, key, options) {
  return {
    [key]: Pick(type3, [key], Clone(options))
  };
}
function FromPropertyKeys3(type3, propertyKeys, options) {
  return propertyKeys.reduce((result, leftKey) => {
    return { ...result, ...FromPropertyKey3(type3, leftKey, options) };
  }, {});
}
function FromMappedKey4(type3, mappedKey, options) {
  return FromPropertyKeys3(type3, mappedKey.keys, options);
}
function PickFromMappedKey(type3, mappedKey, options) {
  const properties = FromMappedKey4(type3, mappedKey, options);
  return MappedResult(properties);
}
var init_pick_from_mapped_key = __esm(() => {
  init_mapped2();
  init_pick();
  init_value();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/pick/index.mjs
var init_pick2 = __esm(() => {
  init_pick_from_mapped_key();
  init_pick_from_mapped_result();
  init_pick();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/partial/partial.mjs
function FromComputed3(target, parameters) {
  return Computed("Partial", [Computed(target, parameters)]);
}
function FromRef13($ref) {
  return Computed("Partial", [Ref($ref)]);
}
function FromProperties16(properties) {
  const partialProperties = {};
  for (const K of globalThis.Object.getOwnPropertyNames(properties))
    partialProperties[K] = Optional(properties[K]);
  return partialProperties;
}
function FromObject16(type3, properties) {
  const options = Discard(type3, [TransformKind, "$id", "required", "properties"]);
  const mappedProperties = FromProperties16(properties);
  return Object2(mappedProperties, options);
}
function FromRest6(types) {
  return types.map((type3) => PartialResolve(type3));
}
function PartialResolve(type3) {
  return IsComputed(type3) ? FromComputed3(type3.target, type3.parameters) : IsRef(type3) ? FromRef13(type3.$ref) : IsIntersect(type3) ? Intersect(FromRest6(type3.allOf)) : IsUnion(type3) ? Union(FromRest6(type3.anyOf)) : IsObject3(type3) ? FromObject16(type3, type3.properties) : IsBigInt3(type3) ? type3 : IsBoolean3(type3) ? type3 : IsInteger2(type3) ? type3 : IsLiteral(type3) ? type3 : IsNull3(type3) ? type3 : IsNumber3(type3) ? type3 : IsString3(type3) ? type3 : IsSymbol3(type3) ? type3 : IsUndefined3(type3) ? type3 : Object2({});
}
function Partial(type3, options) {
  if (IsMappedResult(type3)) {
    return PartialFromMappedResult(type3, options);
  } else {
    return CreateType({ ...PartialResolve(type3), ...options });
  }
}
var init_partial = __esm(() => {
  init_type2();
  init_computed2();
  init_optional2();
  init_object2();
  init_intersect2();
  init_union2();
  init_ref2();
  init_discard();
  init_symbols2();
  init_partial_from_mapped_result();
  init_kind();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/partial/partial-from-mapped-result.mjs
function FromProperties17(K, options) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(K))
    Acc[K2] = Partial(K[K2], Clone(options));
  return Acc;
}
function FromMappedResult11(R, options) {
  return FromProperties17(R.properties, options);
}
function PartialFromMappedResult(R, options) {
  const P = FromMappedResult11(R, options);
  return MappedResult(P);
}
var init_partial_from_mapped_result = __esm(() => {
  init_mapped2();
  init_partial();
  init_value();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/partial/index.mjs
var init_partial2 = __esm(() => {
  init_partial_from_mapped_result();
  init_partial();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/required/required.mjs
function FromComputed4(target, parameters) {
  return Computed("Required", [Computed(target, parameters)]);
}
function FromRef14($ref) {
  return Computed("Required", [Ref($ref)]);
}
function FromProperties18(properties) {
  const requiredProperties = {};
  for (const K of globalThis.Object.getOwnPropertyNames(properties))
    requiredProperties[K] = Discard(properties[K], [OptionalKind]);
  return requiredProperties;
}
function FromObject17(type3, properties) {
  const options = Discard(type3, [TransformKind, "$id", "required", "properties"]);
  const mappedProperties = FromProperties18(properties);
  return Object2(mappedProperties, options);
}
function FromRest7(types) {
  return types.map((type3) => RequiredResolve(type3));
}
function RequiredResolve(type3) {
  return IsComputed(type3) ? FromComputed4(type3.target, type3.parameters) : IsRef(type3) ? FromRef14(type3.$ref) : IsIntersect(type3) ? Intersect(FromRest7(type3.allOf)) : IsUnion(type3) ? Union(FromRest7(type3.anyOf)) : IsObject3(type3) ? FromObject17(type3, type3.properties) : IsBigInt3(type3) ? type3 : IsBoolean3(type3) ? type3 : IsInteger2(type3) ? type3 : IsLiteral(type3) ? type3 : IsNull3(type3) ? type3 : IsNumber3(type3) ? type3 : IsString3(type3) ? type3 : IsSymbol3(type3) ? type3 : IsUndefined3(type3) ? type3 : Object2({});
}
function Required(type3, options) {
  if (IsMappedResult(type3)) {
    return RequiredFromMappedResult(type3, options);
  } else {
    return CreateType({ ...RequiredResolve(type3), ...options });
  }
}
var init_required = __esm(() => {
  init_type2();
  init_computed2();
  init_object2();
  init_intersect2();
  init_union2();
  init_ref2();
  init_symbols2();
  init_discard();
  init_required_from_mapped_result();
  init_kind();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/required/required-from-mapped-result.mjs
function FromProperties19(P, options) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(P))
    Acc[K2] = Required(P[K2], options);
  return Acc;
}
function FromMappedResult12(R, options) {
  return FromProperties19(R.properties, options);
}
function RequiredFromMappedResult(R, options) {
  const P = FromMappedResult12(R, options);
  return MappedResult(P);
}
var init_required_from_mapped_result = __esm(() => {
  init_mapped2();
  init_required();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/required/index.mjs
var init_required2 = __esm(() => {
  init_required_from_mapped_result();
  init_required();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/module/compute.mjs
function DereferenceParameters(moduleProperties, types) {
  return types.map((type3) => {
    return IsRef(type3) ? Dereference(moduleProperties, type3.$ref) : FromType2(moduleProperties, type3);
  });
}
function Dereference(moduleProperties, ref2) {
  return ref2 in moduleProperties ? IsRef(moduleProperties[ref2]) ? Dereference(moduleProperties, moduleProperties[ref2].$ref) : FromType2(moduleProperties, moduleProperties[ref2]) : Never();
}
function FromAwaited(parameters) {
  return Awaited(parameters[0]);
}
function FromIndex(parameters) {
  return Index(parameters[0], parameters[1]);
}
function FromKeyOf(parameters) {
  return KeyOf(parameters[0]);
}
function FromPartial(parameters) {
  return Partial(parameters[0]);
}
function FromOmit(parameters) {
  return Omit(parameters[0], parameters[1]);
}
function FromPick(parameters) {
  return Pick(parameters[0], parameters[1]);
}
function FromRequired(parameters) {
  return Required(parameters[0]);
}
function FromComputed5(moduleProperties, target, parameters) {
  const dereferenced = DereferenceParameters(moduleProperties, parameters);
  return target === "Awaited" ? FromAwaited(dereferenced) : target === "Index" ? FromIndex(dereferenced) : target === "KeyOf" ? FromKeyOf(dereferenced) : target === "Partial" ? FromPartial(dereferenced) : target === "Omit" ? FromOmit(dereferenced) : target === "Pick" ? FromPick(dereferenced) : target === "Required" ? FromRequired(dereferenced) : Never();
}
function FromArray17(moduleProperties, type3) {
  return Array2(FromType2(moduleProperties, type3));
}
function FromAsyncIterator7(moduleProperties, type3) {
  return AsyncIterator(FromType2(moduleProperties, type3));
}
function FromConstructor8(moduleProperties, parameters, instanceType) {
  return Constructor(FromTypes2(moduleProperties, parameters), FromType2(moduleProperties, instanceType));
}
function FromFunction7(moduleProperties, parameters, returnType) {
  return Function2(FromTypes2(moduleProperties, parameters), FromType2(moduleProperties, returnType));
}
function FromIntersect18(moduleProperties, types) {
  return Intersect(FromTypes2(moduleProperties, types));
}
function FromIterator7(moduleProperties, type3) {
  return Iterator(FromType2(moduleProperties, type3));
}
function FromObject18(moduleProperties, properties) {
  return Object2(globalThis.Object.keys(properties).reduce((result, key) => {
    return { ...result, [key]: FromType2(moduleProperties, properties[key]) };
  }, {}));
}
function FromRecord13(moduleProperties, type3) {
  const [value2, pattern2] = [FromType2(moduleProperties, RecordValue2(type3)), RecordPattern(type3)];
  const result = CloneType(type3);
  result.patternProperties[pattern2] = value2;
  return result;
}
function FromTransform(moduleProperties, transform2) {
  return IsRef(transform2) ? { ...Dereference(moduleProperties, transform2.$ref), [TransformKind]: transform2[TransformKind] } : transform2;
}
function FromTuple15(moduleProperties, types) {
  return Tuple(FromTypes2(moduleProperties, types));
}
function FromUnion20(moduleProperties, types) {
  return Union(FromTypes2(moduleProperties, types));
}
function FromTypes2(moduleProperties, types) {
  return types.map((type3) => FromType2(moduleProperties, type3));
}
function FromType2(moduleProperties, type3) {
  return IsOptional(type3) ? CreateType(FromType2(moduleProperties, Discard(type3, [OptionalKind])), type3) : IsReadonly(type3) ? CreateType(FromType2(moduleProperties, Discard(type3, [ReadonlyKind])), type3) : IsTransform(type3) ? CreateType(FromTransform(moduleProperties, type3), type3) : IsArray3(type3) ? CreateType(FromArray17(moduleProperties, type3.items), type3) : IsAsyncIterator3(type3) ? CreateType(FromAsyncIterator7(moduleProperties, type3.items), type3) : IsComputed(type3) ? CreateType(FromComputed5(moduleProperties, type3.target, type3.parameters)) : IsConstructor(type3) ? CreateType(FromConstructor8(moduleProperties, type3.parameters, type3.returns), type3) : IsFunction3(type3) ? CreateType(FromFunction7(moduleProperties, type3.parameters, type3.returns), type3) : IsIntersect(type3) ? CreateType(FromIntersect18(moduleProperties, type3.allOf), type3) : IsIterator3(type3) ? CreateType(FromIterator7(moduleProperties, type3.items), type3) : IsObject3(type3) ? CreateType(FromObject18(moduleProperties, type3.properties), type3) : IsRecord(type3) ? CreateType(FromRecord13(moduleProperties, type3)) : IsTuple(type3) ? CreateType(FromTuple15(moduleProperties, type3.items || []), type3) : IsUnion(type3) ? CreateType(FromUnion20(moduleProperties, type3.anyOf), type3) : type3;
}
function ComputeType(moduleProperties, key) {
  return key in moduleProperties ? FromType2(moduleProperties, moduleProperties[key]) : Never();
}
function ComputeModuleProperties(moduleProperties) {
  return globalThis.Object.getOwnPropertyNames(moduleProperties).reduce((result, key) => {
    return { ...result, [key]: ComputeType(moduleProperties, key) };
  }, {});
}
var init_compute = __esm(() => {
  init_create();
  init_clone3();
  init_discard();
  init_array2();
  init_awaited2();
  init_async_iterator2();
  init_constructor2();
  init_indexed2();
  init_function2();
  init_intersect2();
  init_iterator2();
  init_keyof2();
  init_object2();
  init_omit2();
  init_pick2();
  init_never2();
  init_partial2();
  init_record2();
  init_required2();
  init_tuple2();
  init_union2();
  init_symbols2();
  init_kind();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/module/module.mjs
class TModule {
  constructor($defs) {
    const computed2 = ComputeModuleProperties($defs);
    const identified = this.WithIdentifiers(computed2);
    this.$defs = identified;
  }
  Import(key, options) {
    const $defs = { ...this.$defs, [key]: CreateType(this.$defs[key], options) };
    return CreateType({ [Kind]: "Import", $defs, $ref: key });
  }
  WithIdentifiers($defs) {
    return globalThis.Object.getOwnPropertyNames($defs).reduce((result, key) => {
      return { ...result, [key]: { ...$defs[key], $id: key } };
    }, {});
  }
}
function Module(properties) {
  return new TModule(properties);
}
var init_module = __esm(() => {
  init_create();
  init_symbols2();
  init_compute();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/module/index.mjs
var init_module2 = __esm(() => {
  init_module();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/not/not.mjs
function Not2(type3, options) {
  return CreateType({ [Kind]: "Not", not: type3 }, options);
}
var init_not = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/not/index.mjs
var init_not2 = __esm(() => {
  init_not();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/parameters/parameters.mjs
function Parameters(schema, options) {
  return IsFunction3(schema) ? Tuple(schema.parameters, options) : Never();
}
var init_parameters = __esm(() => {
  init_tuple2();
  init_never2();
  init_kind();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/parameters/index.mjs
var init_parameters2 = __esm(() => {
  init_parameters();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/recursive/recursive.mjs
function Recursive(callback, options = {}) {
  if (IsUndefined2(options.$id))
    options.$id = `T${Ordinal++}`;
  const thisType = CloneType(callback({ [Kind]: "This", $ref: `${options.$id}` }));
  thisType.$id = options.$id;
  return CreateType({ [Hint]: "Recursive", ...thisType }, options);
}
var Ordinal = 0;
var init_recursive = __esm(() => {
  init_type4();
  init_type2();
  init_symbols2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/recursive/index.mjs
var init_recursive2 = __esm(() => {
  init_recursive();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/regexp/regexp.mjs
function RegExp2(unresolved, options) {
  const expr = IsString2(unresolved) ? new globalThis.RegExp(unresolved) : unresolved;
  return CreateType({ [Kind]: "RegExp", type: "RegExp", source: expr.source, flags: expr.flags }, options);
}
var init_regexp = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/regexp/index.mjs
var init_regexp2 = __esm(() => {
  init_regexp();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/rest/rest.mjs
function RestResolve(T) {
  return IsIntersect(T) ? T.allOf : IsUnion(T) ? T.anyOf : IsTuple(T) ? T.items ?? [] : [];
}
function Rest(T) {
  return RestResolve(T);
}
var init_rest = __esm(() => {
  init_kind();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/rest/index.mjs
var init_rest2 = __esm(() => {
  init_rest();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/return-type/return-type.mjs
function ReturnType(schema, options) {
  return IsFunction3(schema) ? CreateType(schema.returns, options) : Never(options);
}
var init_return_type = __esm(() => {
  init_type2();
  init_never2();
  init_kind();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/return-type/index.mjs
var init_return_type2 = __esm(() => {
  init_return_type();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/schema/anyschema.mjs
var init_anyschema = () => {};

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/schema/schema.mjs
var init_schema = () => {};

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/schema/index.mjs
var init_schema2 = __esm(() => {
  init_anyschema();
  init_schema();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/static/static.mjs
var init_static = () => {};

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/static/index.mjs
var init_static2 = __esm(() => {
  init_static();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/transform/transform.mjs
class TransformDecodeBuilder {
  constructor(schema2) {
    this.schema = schema2;
  }
  Decode(decode4) {
    return new TransformEncodeBuilder(this.schema, decode4);
  }
}

class TransformEncodeBuilder {
  constructor(schema2, decode4) {
    this.schema = schema2;
    this.decode = decode4;
  }
  EncodeTransform(encode4, schema2) {
    const Encode2 = (value2) => schema2[TransformKind].Encode(encode4(value2));
    const Decode2 = (value2) => this.decode(schema2[TransformKind].Decode(value2));
    const Codec = { Encode: Encode2, Decode: Decode2 };
    return { ...schema2, [TransformKind]: Codec };
  }
  EncodeSchema(encode4, schema2) {
    const Codec = { Decode: this.decode, Encode: encode4 };
    return { ...schema2, [TransformKind]: Codec };
  }
  Encode(encode4) {
    return IsTransform(this.schema) ? this.EncodeTransform(encode4, this.schema) : this.EncodeSchema(encode4, this.schema);
  }
}
function Transform(schema2) {
  return new TransformDecodeBuilder(schema2);
}
var init_transform2 = __esm(() => {
  init_symbols2();
  init_kind();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/transform/index.mjs
var init_transform3 = __esm(() => {
  init_transform2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/void/void.mjs
function Void(options) {
  return CreateType({ [Kind]: "Void", type: "void" }, options);
}
var init_void = __esm(() => {
  init_type2();
  init_symbols2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/void/index.mjs
var init_void2 = __esm(() => {
  init_void();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/type/type.mjs
var exports_type3 = {};
__export(exports_type3, {
  Void: () => Void,
  Uppercase: () => Uppercase,
  Unsafe: () => Unsafe,
  Unknown: () => Unknown,
  Union: () => Union,
  Undefined: () => Undefined,
  Uncapitalize: () => Uncapitalize,
  Uint8Array: () => Uint8Array2,
  Tuple: () => Tuple,
  Transform: () => Transform,
  TemplateLiteral: () => TemplateLiteral,
  Symbol: () => Symbol2,
  String: () => String2,
  ReturnType: () => ReturnType,
  Rest: () => Rest,
  Required: () => Required,
  RegExp: () => RegExp2,
  Ref: () => Ref,
  Recursive: () => Recursive,
  Record: () => Record,
  ReadonlyOptional: () => ReadonlyOptional,
  Readonly: () => Readonly,
  Promise: () => Promise2,
  Pick: () => Pick,
  Partial: () => Partial,
  Parameters: () => Parameters,
  Optional: () => Optional,
  Omit: () => Omit,
  Object: () => Object2,
  Number: () => Number2,
  Null: () => Null,
  Not: () => Not2,
  Never: () => Never,
  Module: () => Module,
  Mapped: () => Mapped,
  Lowercase: () => Lowercase,
  Literal: () => Literal,
  KeyOf: () => KeyOf,
  Iterator: () => Iterator,
  Intersect: () => Intersect,
  Integer: () => Integer,
  Instantiate: () => Instantiate,
  InstanceType: () => InstanceType,
  Index: () => Index,
  Function: () => Function2,
  Extract: () => Extract,
  Extends: () => Extends,
  Exclude: () => Exclude,
  Enum: () => Enum,
  Date: () => Date2,
  ConstructorParameters: () => ConstructorParameters,
  Constructor: () => Constructor,
  Const: () => Const,
  Composite: () => Composite,
  Capitalize: () => Capitalize,
  Boolean: () => Boolean2,
  BigInt: () => BigInt2,
  Awaited: () => Awaited,
  AsyncIterator: () => AsyncIterator,
  Array: () => Array2,
  Argument: () => Argument,
  Any: () => Any
});
var init_type5 = __esm(() => {
  init_any2();
  init_argument2();
  init_array2();
  init_async_iterator2();
  init_awaited2();
  init_bigint2();
  init_boolean2();
  init_composite2();
  init_const2();
  init_constructor2();
  init_constructor_parameters2();
  init_date2();
  init_enum2();
  init_exclude2();
  init_extends2();
  init_extract2();
  init_function2();
  init_indexed2();
  init_instance_type2();
  init_instantiate2();
  init_integer2();
  init_intersect2();
  init_intrinsic2();
  init_iterator2();
  init_keyof2();
  init_literal2();
  init_mapped2();
  init_module2();
  init_never2();
  init_not2();
  init_null2();
  init_number2();
  init_object2();
  init_omit2();
  init_optional2();
  init_parameters2();
  init_partial2();
  init_pick2();
  init_promise2();
  init_readonly2();
  init_readonly_optional2();
  init_record2();
  init_recursive2();
  init_ref2();
  init_regexp2();
  init_required2();
  init_rest2();
  init_return_type2();
  init_string2();
  init_symbol2();
  init_template_literal2();
  init_transform3();
  init_tuple2();
  init_uint8array2();
  init_undefined2();
  init_union2();
  init_unknown2();
  init_unsafe2();
  init_void2();
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/type/type/index.mjs
var Type;
var init_type6 = __esm(() => {
  init_type5();
  Type = exports_type3;
});

// node_modules/.bun/@sinclair+typebox@0.34.48/node_modules/@sinclair/typebox/build/esm/index.mjs
var init_esm = __esm(() => {
  init_clone3();
  init_create();
  init_error2();
  init_guard2();
  init_helpers();
  init_patterns2();
  init_registry();
  init_sets();
  init_symbols2();
  init_any2();
  init_array2();
  init_argument2();
  init_async_iterator2();
  init_awaited2();
  init_bigint2();
  init_boolean2();
  init_composite2();
  init_const2();
  init_constructor2();
  init_constructor_parameters2();
  init_date2();
  init_enum2();
  init_exclude2();
  init_extends2();
  init_extract2();
  init_function2();
  init_indexed2();
  init_instance_type2();
  init_instantiate2();
  init_integer2();
  init_intersect2();
  init_iterator2();
  init_intrinsic2();
  init_keyof2();
  init_literal2();
  init_module2();
  init_mapped2();
  init_never2();
  init_not2();
  init_null2();
  init_number2();
  init_object2();
  init_omit2();
  init_optional2();
  init_parameters2();
  init_partial2();
  init_pick2();
  init_promise2();
  init_readonly2();
  init_readonly_optional2();
  init_record2();
  init_recursive2();
  init_ref2();
  init_regexp2();
  init_required2();
  init_rest2();
  init_return_type2();
  init_schema2();
  init_static2();
  init_string2();
  init_symbol2();
  init_template_literal2();
  init_transform3();
  init_tuple2();
  init_uint8array2();
  init_undefined2();
  init_union2();
  init_unknown2();
  init_unsafe2();
  init_void2();
  init_type6();
});

// packages/wire/src/wire-property.ts
class WireProperty {
}

// packages/wire/src/features/file-upload.ts
function normalizeFileList(value2) {
  if (!value2)
    return [];
  if (Array.isArray(value2)) {
    const out = [];
    for (let i = 0;i < value2.length; i++) {
      const file = value2[i];
      if (!file)
        continue;
      const entry = {
        id: String(file.id || ""),
        name: String(file.name || ""),
        size: Number(file.size || 0),
        mime: String(file.mime || file.type || ""),
        type: String(file.type || file.mime || "")
      };
      if (entry.name || entry.id)
        out.push(entry);
    }
    return out;
  }
  if (value2 && typeof value2 === "object" && Array.isArray(value2.files)) {
    return normalizeFileList(value2.files);
  }
  if (value2 && typeof value2 === "object") {
    const file = value2;
    const id = String(file.id || "");
    const name = String(file.name || "");
    const size = Number(file.size || 0);
    const mime = String(file.mime || file.type || "");
    const type4 = String(file.type || file.mime || "");
    if (!id && !name)
      return [];
    return [{ id, name, size, mime, type: type4 }];
  }
  return [];
}
var FILE_ENTRY_SCHEMA, WireFile, WireUpload;
var init_file_upload = __esm(() => {
  init_esm();
  FILE_ENTRY_SCHEMA = Type.Object({
    name: Type.String(),
    size: Type.Number({ minimum: 0 }),
    mime: Type.Optional(Type.String()),
    type: Type.Optional(Type.String()),
    id: Type.Optional(Type.String())
  }, { additionalProperties: true });
  WireFile = class WireFile extends WireProperty {
    id = "";
    name = "";
    size = 0;
    mime = "";
    __wire_type = "file";
    constructor(data) {
      super();
      if (data) {
        this.id = data.id;
        this.name = data.name;
        this.size = data.size;
        this.mime = data.mime;
      }
    }
    hydrate(value2) {
      if (value2 && typeof value2 === "object") {
        this.id = String(value2.id || "");
        this.name = String(value2.name || "");
        this.size = Number(value2.size || 0);
        this.mime = String(value2.mime || "");
      }
    }
    dehydrate() {
      return {
        id: this.id,
        name: this.name,
        size: this.size,
        mime: this.mime,
        __wire_type: this.__wire_type
      };
    }
    get file() {
      return this.id ? this : null;
    }
    getPath(store) {
      return store.get(this.id);
    }
  };
  WireUpload = class WireUpload extends WireProperty {
    __wire_type = "upload";
    files = [];
    uploading = null;
    constructor(initial) {
      super();
      this.hydrate(initial);
    }
    hydrate(value2) {
      const normalized = normalizeFileList(value2);
      const files = [];
      for (let i = 0;i < normalized.length; i++) {
        const item = normalized[i];
        files.push(new WireFile({
          id: String(item.id || ""),
          name: String(item.name || ""),
          size: Number(item.size || 0),
          mime: String(item.mime || item.type || "")
        }));
      }
      this.files = files;
      if (value2 && typeof value2 === "object" && value2.uploading) {
        this.uploading = { ...value2.uploading };
      }
    }
    dehydrate() {
      const first = this.file;
      return {
        files: this.files.map((file) => file.dehydrate()),
        id: first?.id || "",
        name: first?.name || "",
        size: Number(first?.size || 0),
        mime: first?.mime || "",
        type: first?.mime || "",
        uploading: this.uploading || undefined,
        __wire_type: this.__wire_type
      };
    }
    clear() {
      this.files = [];
      this.uploading = null;
    }
    add(file) {
      this.files.push(new WireFile({
        id: String(file.id || ""),
        name: String(file.name || ""),
        size: Number(file.size || 0),
        mime: String(file.mime || file.type || "")
      }));
    }
    toArray() {
      return this.files.map((item) => item.dehydrate());
    }
    get file() {
      return this.files[0] || null;
    }
    get id() {
      return this.file?.id || "";
    }
    set id(value2) {
      if (!this.file) {
        if (!value2)
          return;
        this.files = [new WireFile];
      }
      this.files[0].id = String(value2 || "");
    }
    get name() {
      return this.file?.name || "";
    }
    set name(value2) {
      if (!this.file)
        this.files = [new WireFile];
      this.files[0].name = String(value2 || "");
    }
    get size() {
      return Number(this.file?.size || 0);
    }
    set size(value2) {
      if (!this.file)
        this.files = [new WireFile];
      this.files[0].size = Number(value2 || 0);
    }
    get mime() {
      return this.file?.mime || "";
    }
    set mime(value2) {
      if (!this.file)
        this.files = [new WireFile];
      this.files[0].mime = String(value2 || "");
    }
  };
});

// packages/wire/src/features/wire-broadcast.ts
var WireBroadcast;
var init_wire_broadcast = __esm(() => {
  WireBroadcast = class WireBroadcast extends WireProperty {
    options;
    static DEFAULT_TTL_MS = 5 * 60 * 1000;
    static CONNECTION_STALE_FACTOR = 2;
    static CLEANUP_INTERVAL_MS = 60 * 1000;
    static rooms = new Map;
    static cleanupTimer = null;
    __wire_type = "broadcast";
    connected = false;
    connections = 0;
    channel = "global";
    chunks = [];
    state = {};
    constructor(options = {}) {
      super();
      this.options = options;
      this.options.autodelete ??= true;
      if (options.name)
        this.channel = options.name;
      WireBroadcast.ensureCleanupLoop();
    }
    hydrate(value2, room) {
      if (room)
        this.channel = String(room || "").trim() || this.channel;
      if (this.isComponentLike(value2)) {
        this.serverHydrate(value2, room);
        return;
      }
      if (value2 && typeof value2 === "object") {
        if (value2.channel)
          this.channel = value2.channel;
        if (value2.state)
          this.state = value2.state;
        this.connected = !!value2.connected;
        this.connections = Number(value2.connections || 0);
      }
    }
    dehydrate() {
      return {
        channel: this.channel,
        state: this.state,
        connected: this.connected,
        connections: this.connections,
        __wire_type: this.__wire_type
      };
    }
    serverHydrate(component, room) {
      if (room)
        this.channel = String(room || "").trim() || this.channel;
      const roomState = this.getRoom();
      this.touchConnection(roomState, component);
      this.connected = true;
      this.connections = roomState.connections.size;
      const snapshot = this.filterState(roomState.state);
      const keys = Object.keys(snapshot);
      for (let i = 0;i < keys.length; i++) {
        const key = keys[i];
        if (key in component && typeof component[key] !== "function") {
          component[key] = snapshot[key];
        }
      }
      this.state = snapshot;
    }
    update(component, kirewireOrRoom, maybeRoom) {
      const roomName = typeof kirewireOrRoom === "string" ? kirewireOrRoom : String(maybeRoom || "");
      if (roomName)
        this.channel = roomName.trim() || this.channel;
      const kirewire = typeof kirewireOrRoom === "string" ? component?.$wire_instance : kirewireOrRoom || component?.$wire_instance;
      const roomState = this.getRoom();
      this.touchConnection(roomState, component);
      this.connected = true;
      this.connections = roomState.connections.size;
      const current = this.filterState(component);
      const keys = Object.keys(current);
      let changed = false;
      for (let i = 0;i < keys.length; i++) {
        const key = keys[i];
        if (JSON.stringify(roomState.state[key]) !== JSON.stringify(current[key])) {
          roomState.state[key] = current[key];
          changed = true;
        }
      }
      if (changed && kirewire && typeof kirewire.emit === "function") {
        this.state = { ...roomState.state };
        kirewire.emit(`broadcast:${this.channel}`, {
          channel: this.channel,
          roomId: this.getRoomId(),
          state: this.state
        });
      }
    }
    disconnect(component) {
      const room = this.findRoom();
      if (!room) {
        this.connected = false;
        this.connections = 0;
        return;
      }
      room.connections.delete(this.makeConnectionId(component));
      room.lastSeen = Date.now();
      this.connections = room.connections.size;
      this.connected = this.connections > 0;
    }
    getRoomId(room) {
      const channel = String(room || this.channel || "").trim() || "global";
      return this.makeRoomId(channel, this.options.password);
    }
    static cleanupNow(now = Date.now()) {
      for (const [roomId, room] of WireBroadcast.rooms.entries()) {
        WireBroadcast.pruneConnections(room, now);
        if (room.connections.size > 0) {
          room.lastSeen = now;
        }
        if (room.autodelete && now - room.lastSeen > room.ttlMs && room.connections.size === 0) {
          WireBroadcast.rooms.delete(roomId);
        }
      }
    }
    getRoom() {
      const roomId = this.makeRoomId(this.channel, this.options.password);
      let room = WireBroadcast.rooms.get(roomId);
      if (!room) {
        room = {
          state: {},
          connections: new Map,
          password: this.options.password,
          lastSeen: Date.now(),
          ttlMs: this.getTtlMs(),
          autodelete: this.options.autodelete !== false
        };
        WireBroadcast.rooms.set(roomId, room);
      } else {
        WireBroadcast.pruneConnections(room);
        room.lastSeen = Date.now();
      }
      return room;
    }
    findRoom() {
      return WireBroadcast.rooms.get(this.getRoomId()) || null;
    }
    isComponentLike(value2) {
      if (!value2 || typeof value2 !== "object")
        return false;
      const candidate = value2;
      return "$id" in candidate || "$wire_instance" in candidate || typeof candidate.render === "function" || typeof candidate.mount === "function";
    }
    filterState(state) {
      const result = {};
      const keys = Object.keys(state || {});
      for (let i = 0;i < keys.length; i++) {
        const key = keys[i];
        if (key.charCodeAt(0) === 36 || key.charCodeAt(0) === 95)
          continue;
        if (typeof state[key] === "function")
          continue;
        if (this.options.excludes?.includes(key))
          continue;
        if (this.options.includes && !this.options.includes.includes(key))
          continue;
        result[key] = state[key];
      }
      return result;
    }
    static ensureCleanupLoop() {
      if (WireBroadcast.cleanupTimer)
        return;
      const timer = setInterval(() => {
        WireBroadcast.cleanupNow(Date.now());
      }, WireBroadcast.CLEANUP_INTERVAL_MS);
      if (typeof timer?.unref === "function") {
        timer.unref();
      }
      WireBroadcast.cleanupTimer = timer;
    }
    touchConnection(room, component) {
      WireBroadcast.pruneConnections(room);
      const connectionId = this.makeConnectionId(component);
      room.connections.set(connectionId, Date.now());
      room.lastSeen = Date.now();
    }
    getTtlMs() {
      return Number(this.options.ttlMs) || WireBroadcast.DEFAULT_TTL_MS;
    }
    makeRoomId(channel, password) {
      const normalizedChannel = String(channel || "").trim() || "global";
      return `${normalizedChannel}:${password || ""}`;
    }
    makeConnectionId(component) {
      const id = String(component.$id || "anonymous");
      return `${id}:${this.channel}`;
    }
    static pruneConnections(room, now = Date.now()) {
      const staleAfter = Math.max(WireBroadcast.CLEANUP_INTERVAL_MS, room.ttlMs * WireBroadcast.CONNECTION_STALE_FACTOR);
      for (const [connectionId, lastSeen] of room.connections.entries()) {
        if (now - lastSeen > staleAfter) {
          room.connections.delete(connectionId);
        }
      }
    }
  };
});

// packages/wire/src/validation/rule.ts
function escapeRegexLiteral(input) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function mergePatterns(patterns3) {
  if (!patterns3.length)
    return;
  if (patterns3.length === 1)
    return patterns3[0];
  return `^(?=${patterns3.join(")(?=")})[\\s\\S]*$`;
}
function parseRegexRule(raw) {
  if (!raw)
    return;
  const s = raw.trim();
  if (s.startsWith("/") && s.lastIndexOf("/") > 0) {
    const last = s.lastIndexOf("/");
    return s.slice(1, last);
  }
  return s;
}
function buildStringDeclaration(parts, defaultValue) {
  const options = {};
  if (defaultValue !== undefined)
    options.default = defaultValue;
  const patterns3 = [];
  for (const p of parts) {
    const [key, raw] = p.split(":", 2);
    const n = raw !== undefined ? Number(raw) : undefined;
    switch (key) {
      case "min":
        if (Number.isFinite(n))
          options.minLength = n;
        break;
      case "max":
        if (Number.isFinite(n))
          options.maxLength = n;
        break;
      case "between": {
        const [a, b] = (raw ?? "").split(",").map((x) => Number(x));
        if (Number.isFinite(a))
          options.minLength = a;
        if (Number.isFinite(b))
          options.maxLength = b;
        break;
      }
      case "size":
      case "len":
      case "length":
        if (Number.isFinite(n)) {
          options.minLength = n;
          options.maxLength = n;
        }
        break;
      case "email":
        options.format = "email";
        break;
      case "url":
      case "uri":
        options.format = "uri";
        break;
      case "ipv4":
        options.format = "ipv4";
        break;
      case "ipv6":
        options.format = "ipv6";
        break;
      case "uuid":
        options.format = "uuid";
        break;
      case "date":
        options.format = "date";
        break;
      case "date_time":
      case "datetime":
        options.format = "date-time";
        break;
      case "regex": {
        const rx = parseRegexRule(raw);
        if (rx)
          patterns3.push(rx);
        break;
      }
      case "alpha":
        patterns3.push("^[A-Za-z]+$");
        break;
      case "alpha_num":
        patterns3.push("^[A-Za-z0-9]+$");
        break;
      case "alpha_dash":
        patterns3.push("^[A-Za-z0-9_-]+$");
        break;
      case "ascii":
        patterns3.push("^[\\x00-\\x7F]*$");
        break;
      case "starts_with": {
        const list = (raw ?? "").split(",").map((x) => x.trim()).filter(Boolean).map(escapeRegexLiteral);
        if (list.length)
          patterns3.push(`^(?:${list.join("|")})`);
        break;
      }
      case "ends_with": {
        const list = (raw ?? "").split(",").map((x) => x.trim()).filter(Boolean).map(escapeRegexLiteral);
        if (list.length)
          patterns3.push(`(?:${list.join("|")})$`);
        break;
      }
      case "digits":
        if (Number.isFinite(n))
          patterns3.push(`^\\d{${n}}$`);
        break;
      case "digits_between": {
        const [a, b] = (raw ?? "").split(",").map((x) => Number(x));
        if (Number.isFinite(a) && Number.isFinite(b)) {
          patterns3.push(`^\\d{${a},${b}}$`);
        }
        break;
      }
      case "ulid":
        patterns3.push("^[0-9A-HJKMNP-TV-Z]{26}$");
        break;
      case "slug":
        patterns3.push("^[a-z0-9]+(?:-[a-z0-9]+)*$");
        break;
    }
  }
  const merged = mergePatterns(patterns3);
  if (merged)
    options.pattern = merged;
  return Type.String(options);
}
function applyNumericConstraints(parts, options) {
  for (const p of parts) {
    const [key, raw] = p.split(":", 2);
    const n = raw !== undefined ? Number(raw) : undefined;
    switch (key) {
      case "min":
        if (Number.isFinite(n))
          options.minimum = n;
        break;
      case "max":
        if (Number.isFinite(n))
          options.maximum = n;
        break;
      case "between": {
        const [a, b] = (raw ?? "").split(",").map((x) => Number(x));
        if (Number.isFinite(a))
          options.minimum = a;
        if (Number.isFinite(b))
          options.maximum = b;
        break;
      }
      case "gt":
        if (Number.isFinite(n))
          options.exclusiveMinimum = n;
        break;
      case "gte":
        if (Number.isFinite(n))
          options.minimum = n;
        break;
      case "lt":
        if (Number.isFinite(n))
          options.exclusiveMaximum = n;
        break;
      case "lte":
        if (Number.isFinite(n))
          options.maximum = n;
        break;
      case "multiple_of":
        if (Number.isFinite(n) && n !== 0)
          options.multipleOf = n;
        break;
    }
  }
}
function buildNumberDeclaration(parts, defaultValue) {
  const options = {};
  if (defaultValue !== undefined)
    options.default = defaultValue;
  applyNumericConstraints(parts, options);
  return Type.Number(options);
}
function buildIntegerDeclaration(parts, defaultValue) {
  const options = {};
  if (defaultValue !== undefined)
    options.default = defaultValue;
  applyNumericConstraints(parts, options);
  return Type.Integer(options);
}
function buildBooleanDeclaration(defaultValue) {
  const options = {};
  if (defaultValue !== undefined)
    options.default = defaultValue;
  return Type.Boolean(options);
}
function buildEnumDeclaration(values, defaultValue) {
  const options = {};
  if (defaultValue !== undefined)
    options.default = defaultValue;
  return Type.Union(values.map((v) => Type.Literal(v)), options);
}
function buildRuleSchema(rules, defaultValue) {
  const parts = String(rules || "").split("|").map((p) => p.trim()).filter(Boolean);
  const isOptional = parts.includes("optional");
  const isNullable = parts.includes("nullable");
  const inRule = parts.find((p) => p.startsWith("in:"));
  let schema3;
  if (inRule) {
    const values = inRule.slice(3).split(",").map((v) => v.trim()).filter(Boolean);
    schema3 = buildEnumDeclaration(values, defaultValue);
  } else if (parts.includes("boolean") || parts.includes("bool")) {
    schema3 = buildBooleanDeclaration(defaultValue);
  } else if (parts.includes("integer") || parts.includes("int")) {
    schema3 = buildIntegerDeclaration(parts, defaultValue);
  } else if (parts.includes("number") || parts.includes("numeric")) {
    schema3 = buildNumberDeclaration(parts, defaultValue);
  } else {
    schema3 = buildStringDeclaration(parts, defaultValue);
  }
  if (isNullable)
    schema3 = Type.Union([schema3, Type.Null()]);
  if (isOptional || isNullable)
    schema3 = Type.Optional(schema3);
  return schema3;
}
function makeRuleDescriptor(ruleStr, message2) {
  return {
    ruleStr,
    message: message2,
    schema: buildRuleSchema(ruleStr)
  };
}
function isTypeBoxSchema(value2) {
  return !!value2 && typeof value2 === "object" && Kind in value2;
}
function isRequiredRule(ruleStr) {
  const parts = String(ruleStr || "").split("|").map((p) => p.trim()).filter(Boolean);
  return parts.includes("required") || parts.includes("filled") || parts.includes("present");
}
function isEmptyValidationValue(value2) {
  return value2 === undefined || value2 === null || value2 === "";
}
function validateTypeBoxSchema(schema3, value2, customMessage) {
  if (exports_value2.Check(schema3, value2)) {
    return { success: true };
  }
  if (customMessage) {
    return { success: false, error: customMessage };
  }
  const first = [...exports_value2.Errors(schema3, value2)][0];
  return { success: false, error: first?.message || "Validation failed" };
}
function validateRuleString(value2, ruleStr, customMessage) {
  const required3 = isRequiredRule(ruleStr);
  if (required3 && isEmptyValidationValue(value2)) {
    return { success: false, error: customMessage || "The field is required." };
  }
  if (!required3 && isEmptyValidationValue(value2)) {
    return { success: true };
  }
  const schema3 = buildRuleSchema(ruleStr);
  return validateTypeBoxSchema(schema3, value2, customMessage);
}
var SIMPLE_FORMATS;
var init_rule = __esm(() => {
  init_esm();
  init_value4();
  SIMPLE_FORMATS = [
    { name: "email", check: (value2) => /^\S+@\S+\.\S+$/.test(value2) },
    {
      name: "uri",
      check: (value2) => {
        try {
          new URL(value2);
          return true;
        } catch {
          return false;
        }
      }
    },
    {
      name: "ipv4",
      check: (value2) => /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(value2)
    },
    {
      name: "ipv6",
      check: (value2) => /^(([0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4}|([0-9A-Fa-f]{1,4}:){1,7}:|::1|::)$/.test(value2)
    },
    {
      name: "uuid",
      check: (value2) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value2)
    },
    {
      name: "date",
      check: (value2) => /^\d{4}-\d{2}-\d{2}$/.test(value2)
    },
    {
      name: "date-time",
      check: (value2) => !Number.isNaN(Date.parse(value2))
    }
  ];
  for (const format of SIMPLE_FORMATS) {
    if (!exports_format.Has(format.name)) {
      exports_format.Set(format.name, format.check);
    }
  }
});

// packages/wire/src/metadata.ts
function getWireComponentDefinition(target) {
  if (!target || typeof target !== "function")
    return;
  return wireDefinitionByClass.get(target);
}
function getWireVariables(target) {
  const out = new Map;
  if (!target || typeof target !== "function")
    return out;
  let current = target;
  while (current && current !== Function.prototype) {
    const own = variableDefinitionByClass.get(current);
    if (own) {
      for (const [name, definition] of own.entries()) {
        if (!out.has(name))
          out.set(name, definition);
      }
    }
    const proto = Object.getPrototypeOf(current.prototype);
    if (!proto || proto === Object.prototype)
      break;
    current = proto.constructor;
  }
  return out;
}
var wireDefinitionByClass, variableDefinitionByClass;
var init_metadata = __esm(() => {
  init_rule();
  wireDefinitionByClass = new WeakMap;
  variableDefinitionByClass = new WeakMap;
});

// packages/wire/src/component.ts
var exports_component = {};
__export(exports_component, {
  Component: () => Component
});

class Component {
  $live = false;
  $id;
  $kire;
  view(view, data = {}) {
    const locals = { ...this, ...data };
    let proto = Object.getPrototypeOf(this);
    while (proto && proto !== Object.prototype) {
      const descriptors = Object.getOwnPropertyDescriptors(proto);
      const keys = Object.keys(descriptors);
      for (let i = 0;i < keys.length; i++) {
        const key = keys[i];
        if (key === "constructor" || key in locals)
          continue;
        const descriptor = descriptors[key];
        if (typeof descriptor.get === "function") {
          try {
            locals[key] = this[key];
          } catch {}
        }
      }
      proto = Object.getPrototypeOf(proto);
    }
    if (!Object.hasOwn(locals, "errors")) {
      locals.errors = this.__errors;
    }
    locals.$wire = this;
    return this.$kire.view(view, locals);
  }
  $set(property, value2) {
    const normalizedProperty = String(property || "").trim();
    if (!this.isPropertyWritable(normalizedProperty)) {
      throw new Error(`Property "${normalizedProperty}" is not writable.`);
    }
    if (!normalizedProperty.includes(".")) {
      const current = this[normalizedProperty];
      const declaration = this.getVariableDeclaration(normalizedProperty);
      this[normalizedProperty] = this.normalizeIncomingValue(current, value2, declaration);
      return;
    }
    const parts = normalizedProperty.split(".");
    const root = parts[0];
    const rootDeclaration = this.getVariableDeclaration(root);
    let obj = this;
    for (let i = 0;i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in obj) || obj[part] === null || typeof obj[part] !== "object") {
        obj[part] = {};
      }
      obj = obj[part];
    }
    const leaf = parts[parts.length - 1];
    obj[leaf] = this.normalizeIncomingValue(obj[leaf], value2);
    if (rootDeclaration) {
      const rootValue = this[root];
      this[root] = this.normalizeIncomingValue(rootValue, rootValue, rootDeclaration);
    }
  }
  $canSet(property) {
    return this.isPropertyWritable(property);
  }
  validate(rules) {
    this.clearErrors();
    let isValid = true;
    const state = this.getPublicState();
    for (const [field, validatorOrArray] of Object.entries(rules || {})) {
      const value2 = this.getValueByPath(field);
      const validators = Array.isArray(validatorOrArray) ? validatorOrArray : [validatorOrArray];
      for (const validator of validators) {
        const result = this.runValidator(value2, validator, state);
        if (!result.success) {
          this.addError(field, result.error || "Invalid");
          isValid = false;
          break;
        }
      }
    }
    return isValid;
  }
  rule(ruleStr, message2) {
    return makeRuleDescriptor(ruleStr, message2);
  }
  __errors = {};
  __effects = [];
  __skipRender = false;
  $clearEffects() {
    this.__effects = [];
  }
  $effect(type4, payload) {
    this.__effects.push({ type: type4, payload });
  }
  skipRender(value2 = true) {
    this.__skipRender = !!value2;
  }
  $skipRender(value2 = true) {
    this.skipRender(value2);
  }
  emit(name, ...params) {
    this.$effect("event", { name, params });
    if (this.$wire_instance) {
      this.$wire_instance.emit(`event:${name}`, {
        params,
        sourceId: this.$id
      });
    }
  }
  $emit(name, ...params) {
    this.emit(name, ...params);
  }
  redirect(url) {
    this.$effect("redirect", url);
  }
  $redirect(url) {
    this.redirect(url);
  }
  stream(target, content, method = "update") {
    this.$effect("stream", { target, content, method });
  }
  $stream(target, content, method = "update") {
    this.stream(target, content, method);
  }
  collection(name, payload) {
    const target = String(name || "").trim();
    if (!target)
      return;
    this.$effect("collection", {
      name: target,
      ...payload
    });
  }
  replaceCollection(path, items = [], options = {}) {
    this.collection(path, {
      mode: "state",
      path,
      action: "replace",
      items: Array.isArray(items) ? items : [],
      key: options.key || "id",
      limit: options.limit
    });
  }
  appendToCollection(path, items, options = {}) {
    const list = Array.isArray(items) ? items : [items];
    this.collection(path, {
      mode: "state",
      path,
      action: "append",
      items: list.filter((item) => item !== undefined && item !== null),
      key: options.key || "id",
      limit: options.limit
    });
  }
  prependToCollection(path, items, options = {}) {
    const list = Array.isArray(items) ? items : [items];
    this.collection(path, {
      mode: "state",
      path,
      action: "prepend",
      items: list.filter((item) => item !== undefined && item !== null),
      key: options.key || "id",
      limit: options.limit
    });
  }
  upsertCollection(path, items, options = {}) {
    const list = Array.isArray(items) ? items : [items];
    this.collection(path, {
      mode: "state",
      path,
      action: "upsert",
      items: list.filter((item) => item !== undefined && item !== null),
      key: options.key || "id",
      limit: options.limit,
      position: options.position || "append"
    });
  }
  removeFromCollection(path, keys, options = {}) {
    const list = Array.isArray(keys) ? keys : [keys];
    this.collection(path, {
      mode: "state",
      path,
      action: "remove",
      keys: list.filter((item) => item !== undefined && item !== null),
      key: options.key || "id"
    });
  }
  replaceCollectionHtml(name, content) {
    this.collection(name, {
      mode: "dom",
      action: "replace",
      content: String(content || "")
    });
  }
  appendCollectionHtml(name, content, options = {}) {
    this.collection(name, {
      mode: "dom",
      action: "append",
      content: String(content || ""),
      key: options.key === undefined || options.key === null ? undefined : String(options.key)
    });
  }
  prependCollectionHtml(name, content, options = {}) {
    this.collection(name, {
      mode: "dom",
      action: "prepend",
      content: String(content || ""),
      key: options.key === undefined || options.key === null ? undefined : String(options.key)
    });
  }
  upsertCollectionHtml(name, content, options) {
    this.collection(name, {
      mode: "dom",
      action: "upsert",
      content: String(content || ""),
      key: String(options.key),
      position: options.position || "append"
    });
  }
  removeCollectionHtml(name, keys) {
    const list = Array.isArray(keys) ? keys : [keys];
    this.collection(name, {
      mode: "dom",
      action: "remove",
      keys: list.filter((item) => item !== undefined && item !== null).map((item) => String(item))
    });
  }
  addError(field, message2) {
    this.__errors[field] = message2;
  }
  clearErrors(field) {
    if (field)
      delete this.__errors[field];
    else
      this.__errors = {};
  }
  fill(state) {
    if (!state)
      return;
    this.ensureDeclaredWireVariables();
    const declarations = this.getVariableDeclarations();
    if (declarations.size > 0) {
      const keys2 = Object.keys(state);
      for (let i = 0;i < keys2.length; i++) {
        const key = keys2[i];
        const declaration = declarations.get(key);
        if (!declaration || declaration.isPrivate)
          continue;
        if (!(key in this))
          continue;
        const current = this[key];
        const value2 = state[key];
        this[key] = this.normalizeIncomingValue(current, value2, declaration);
      }
      return;
    }
    const keys = Object.keys(state);
    for (let i = 0;i < keys.length; i++) {
      const key = keys[i];
      if (!(key in this))
        continue;
      const current = this[key];
      const value2 = state[key];
      if (current instanceof WireProperty) {
        current.hydrate(value2);
      } else {
        this[key] = value2;
      }
    }
  }
  getPublicState() {
    this.ensureDeclaredWireVariables();
    const declarations = this.getVariableDeclarations();
    if (declarations.size > 0) {
      const declaredState = Object.create(null);
      for (const [name, declaration] of declarations.entries()) {
        if (declaration.isPrivate)
          continue;
        const value2 = this[name];
        if (typeof value2 === "function")
          continue;
        if (value2 instanceof WireProperty) {
          declaredState[name] = value2.dehydrate();
        } else if (declaration.kind === "files") {
          const upload = this.normalizeIncomingValue(value2, value2, declaration);
          declaredState[name] = upload.dehydrate();
        } else {
          declaredState[name] = value2;
        }
      }
      return declaredState;
    }
    const state = Object.create(null);
    const keys = Object.keys(this);
    for (let i = 0;i < keys.length; i++) {
      const key = keys[i];
      if (key.charCodeAt(0) === 36 || key.charCodeAt(0) === 95)
        continue;
      const value2 = this[key];
      if (typeof value2 === "function")
        continue;
      if (value2 instanceof WireProperty) {
        state[key] = value2.dehydrate();
      } else {
        state[key] = value2;
      }
    }
    return state;
  }
  normalizeIncomingValue(current, value2, declaration) {
    if (current instanceof WireProperty) {
      current.hydrate(value2);
      return current;
    }
    if (!declaration)
      return value2;
    if (declaration.kind === "broadcast") {
      const channel = declaration.room || declaration.name;
      if (current instanceof WireBroadcast) {
        if (value2 && typeof value2 === "object")
          current.hydrate(value2);
        return current;
      }
      const next = new WireBroadcast({
        name: channel
      });
      if (value2 && typeof value2 === "object")
        next.hydrate(value2);
      return next;
    }
    if (declaration.kind === "files") {
      const upload = current instanceof WireUpload ? current : new WireUpload(current);
      upload.hydrate(value2);
      this.validateFilesVariable(declaration, upload);
      return upload;
    }
    if (declaration.schema) {
      const converted = exports_value2.Convert(declaration.schema, value2);
      if (!exports_value2.Check(declaration.schema, converted)) {
        throw new Error(`Invalid value for variable "${declaration.name}" (${declaration.raw || declaration.kind}).`);
      }
      this.validateDeclaredShapeRules(declaration, converted);
      return converted;
    }
    this.validateDeclaredShapeRules(declaration, value2);
    return value2;
  }
  onlyserver(value2) {
    return value2;
  }
  isPropertyWritable(property) {
    const normalized = String(property || "").trim();
    if (!normalized)
      return false;
    this.ensureDeclaredWireVariables();
    const segments = normalized.split(".").map((part) => part.trim()).filter(Boolean);
    if (segments.length === 0)
      return false;
    for (let i = 0;i < segments.length; i++) {
      if (BLOCKED_SET_PATH_SEGMENTS.has(segments[i]))
        return false;
    }
    const root = segments[0];
    const first = root.charCodeAt(0);
    if (first === 36 || first === 95)
      return false;
    const declarations = this.getVariableDeclarations();
    if (declarations.size > 0) {
      const declaration = declarations.get(root);
      if (!declaration)
        return false;
      if (declaration.isPrivate)
        return false;
      if (declaration.kind === "broadcast")
        return false;
      const fillable2 = this.$fillable;
      if (Array.isArray(fillable2) && fillable2.length > 0) {
        return this.matchesFillablePath(normalized, fillable2);
      }
      return true;
    }
    const fillable = this.$fillable;
    if (Array.isArray(fillable) && fillable.length > 0) {
      return this.matchesFillablePath(normalized, fillable);
    }
    const state = this.getPublicState();
    return Object.hasOwn(state, root);
  }
  getVariableDeclarations() {
    return getWireVariables(this.constructor);
  }
  getVariableDeclaration(propertyPath) {
    const root = String(propertyPath || "").split(".").map((entry) => entry.trim()).filter(Boolean)[0];
    if (!root)
      return;
    return this.getVariableDeclarations().get(root);
  }
  ensureDeclaredWireVariables() {
    const declarations = this.getVariableDeclarations();
    if (declarations.size === 0)
      return;
    for (const [name, declaration] of declarations.entries()) {
      if (this[name] !== undefined)
        continue;
      if (declaration.kind === "files") {
        this[name] = new WireUpload;
        continue;
      }
      if (declaration.kind === "broadcast") {
        this[name] = new WireBroadcast({
          name: declaration.room || name
        });
      }
    }
  }
  validateFilesVariable(declaration, upload) {
    const files = normalizeFileList(upload.dehydrate());
    if (typeof declaration.minItems === "number" && files.length < declaration.minItems) {
      throw new Error(`Variable "${declaration.name}" requires at least ${declaration.minItems} file(s).`);
    }
    if (typeof declaration.maxItems === "number" && files.length > declaration.maxItems) {
      throw new Error(`Variable "${declaration.name}" accepts at most ${declaration.maxItems} file(s).`);
    }
    if (typeof declaration.maxBytes === "number" && declaration.maxBytes > 0) {
      for (let i = 0;i < files.length; i++) {
        const file = files[i];
        if (Number(file.size || 0) > declaration.maxBytes) {
          throw new Error(`File "${file.name || "upload"}" exceeds max size for "${declaration.name}".`);
        }
      }
    }
  }
  matchesFillablePath(property, fillable) {
    const normalizedProperty = String(property || "").trim();
    if (!normalizedProperty)
      return false;
    for (let i = 0;i < fillable.length; i++) {
      const raw = String(fillable[i] || "").trim();
      if (!raw)
        continue;
      if (raw === "*" || raw === normalizedProperty)
        return true;
      if (raw.endsWith(".*")) {
        const base = raw.slice(0, -2);
        if (normalizedProperty === base || normalizedProperty.startsWith(`${base}.`)) {
          return true;
        }
        continue;
      }
      if (normalizedProperty.startsWith(`${raw}.`))
        return true;
    }
    return false;
  }
  unpackEvent(event) {
    const payload = event?.params?.[0] ?? event?.detail?.params?.[0] ?? event?.detail ?? event;
    if (payload === undefined || payload === null)
      return null;
    return payload;
  }
  appendUniqueBy(list, item, key = "id") {
    if (!item)
      return Array.isArray(list) ? list : [];
    const normalized = Array.isArray(list) ? list : [];
    const needle = item[key];
    if (needle === undefined || needle === null)
      return [...normalized, item];
    if (normalized.some((entry) => entry?.[key] === needle))
      return normalized;
    return [...normalized, item];
  }
  prependUniqueBy(list, item, key = "id") {
    if (!item)
      return Array.isArray(list) ? list : [];
    const normalized = Array.isArray(list) ? list : [];
    const needle = item[key];
    if (needle === undefined || needle === null)
      return [item, ...normalized];
    if (normalized.some((entry) => entry?.[key] === needle))
      return normalized;
    return [item, ...normalized];
  }
  upsertBy(list, item, key = "id", mode = "append") {
    if (!item)
      return Array.isArray(list) ? list : [];
    const normalized = Array.isArray(list) ? list : [];
    const needle = item[key];
    if (needle === undefined || needle === null) {
      return mode === "prepend" ? [item, ...normalized] : [...normalized, item];
    }
    const next = normalized.filter((entry) => entry?.[key] !== needle);
    return mode === "prepend" ? [item, ...next] : [...next, item];
  }
  runValidator(value2, validator, state) {
    if (typeof validator === "function") {
      const result = validator(value2, state);
      if (result === false)
        return { success: false, error: "Invalid" };
      if (typeof result === "string")
        return { success: false, error: result };
      return { success: true };
    }
    if (typeof validator === "string") {
      return validateRuleString(this.normalizeValidationValue(value2), validator);
    }
    if (validator && typeof validator === "object") {
      if (typeof validator.validate === "function") {
        const result = validator.validate(value2);
        if (result.success)
          return { success: true };
        return { success: false, error: result.errors?.[0] || "Invalid." };
      }
      if ("ruleStr" in validator && "schema" in validator) {
        const helper = validator;
        return validateRuleString(this.normalizeValidationValue(value2), helper.ruleStr, helper.message);
      }
      if (isTypeBoxSchema(validator)) {
        return validateTypeBoxSchema(validator, this.normalizeValidationValue(value2));
      }
    }
    return { success: true };
  }
  normalizeValidationValue(value2) {
    if (value2 instanceof WireProperty) {
      return value2.dehydrate();
    }
    return value2;
  }
  getValueByPath(path) {
    if (!path.includes(".")) {
      return this[path];
    }
    const parts = path.split(".");
    let current = this;
    for (let i = 0;i < parts.length; i++) {
      if (current === undefined || current === null) {
        return;
      }
      current = current[parts[i]];
    }
    return current;
  }
  validateDeclaredShapeRules(declaration, value2) {
    const shapeRules = declaration.shapeRules;
    if (!shapeRules || typeof shapeRules !== "object")
      return;
    const entries = Object.entries(shapeRules);
    for (let i = 0;i < entries.length; i++) {
      const [rawPath, rule] = entries[i];
      const path = String(rawPath || "").trim();
      const normalizedRule = String(rule || "").trim();
      if (!path || !normalizedRule)
        continue;
      const candidates = this.collectPathCandidates(value2, path);
      const hasWildcard = path.includes("*");
      if (candidates.length === 0 && hasWildcard)
        continue;
      const targets = candidates.length > 0 ? candidates : [{ path, value: undefined }];
      for (let j = 0;j < targets.length; j++) {
        const candidate = targets[j];
        const result = validateRuleString(this.normalizeValidationValue(candidate.value), normalizedRule);
        if (result.success)
          continue;
        const suffix = candidate.path ? `.${candidate.path}` : "";
        throw new Error(`Invalid value for variable "${declaration.name}${suffix}" (${result.error || "Invalid"}).`);
      }
    }
  }
  collectPathCandidates(source, path) {
    const segments = String(path || "").split(".").map((part) => part.trim()).filter(Boolean);
    if (segments.length === 0)
      return [{ path: "", value: source }];
    const candidates = [];
    const hasWildcard = segments.includes("*");
    const walk = (current, index, resolved) => {
      if (index >= segments.length) {
        candidates.push({
          path: resolved.join("."),
          value: current
        });
        return;
      }
      const segment = segments[index];
      if (segment === "*") {
        if (!current || typeof current !== "object")
          return;
        const keys = Array.isArray(current) ? current.map((_, itemIndex) => String(itemIndex)) : Object.keys(current);
        for (let i = 0;i < keys.length; i++) {
          const key = keys[i];
          walk(current[key], index + 1, [...resolved, key]);
        }
        return;
      }
      if (!current || typeof current !== "object") {
        if (index === segments.length - 1) {
          candidates.push({
            path: [...resolved, segment].join("."),
            value: undefined
          });
        }
        return;
      }
      walk(current[segment], index + 1, [...resolved, segment]);
    };
    walk(source, 0, []);
    if (candidates.length === 0 && !hasWildcard) {
      return [{ path, value: undefined }];
    }
    return candidates;
  }
  mount() {}
  unmount() {}
  render() {
    if (this.$live)
      return "";
    throw new Error(`Component "${this.constructor?.name || "AnonymousComponent"}" must implement render() unless $live = true.`);
  }
}
var BLOCKED_SET_PATH_SEGMENTS;
var init_component = __esm(() => {
  init_value4();
  init_file_upload();
  init_wire_broadcast();
  init_metadata();
  init_rule();
  BLOCKED_SET_PATH_SEGMENTS = new Set([
    "__proto__",
    "constructor",
    "prototype"
  ]);
});

// examples/fivem-example/server.ts
var import_node_stream = require("node:stream");
var import_node_fs3 = require("node:fs");
var import_node_path3 = __toESM(require("node:path"));

// node_modules/.bun/koa@2.16.4/node_modules/koa/dist/koa.mjs
var import_application = __toESM(require_application(), 1);
var koa_default = import_application.default;
var HttpError = import_application.default.HttpError;

// examples/fivem-example/server.ts
var import_koa_router = __toESM(require_router(), 1);
var import_http_wrapper = __toESM(require_http_wrapper(), 1);

// packages/wire/src/adapters/http.ts
var import_node_fs2 = require("node:fs");
var import_node_path2 = require("node:path");
var import_node_url = require("node:url");

// packages/wire/src/adapter.ts
class Adapter {
  wire;
  kire;
  install(wire, kire) {
    this.wire = wire;
    this.kire = kire;
    this.setup();
  }
}

// packages/wire/src/adapters/http.ts
init_component();

// packages/wire/src/features/file-store.ts
var import_node_crypto = require("node:crypto");
var import_node_fs = require("node:fs");
var import_node_path = require("node:path");

class FileStore {
  ttl;
  tempDir;
  fileMap = new Map;
  cleanupTimer;
  constructor(tempDir, ttl = 3600000) {
    this.ttl = ttl;
    this.tempDir = tempDir;
    if (!import_node_fs.existsSync(this.tempDir)) {
      import_node_fs.mkdirSync(this.tempDir, { recursive: true });
    }
    this.cleanupTimer = setInterval(() => this.cleanup(), 60000);
    if (typeof this.cleanupTimer?.unref === "function") {
      this.cleanupTimer.unref();
    }
  }
  store(filename, buffer) {
    const id = import_node_crypto.randomUUID();
    const safeName = import_node_path.basename(String(filename || "upload.bin")).replace(/[^\w.-]/g, "_");
    const path = import_node_path.join(this.tempDir, `${id}_${safeName}`);
    import_node_fs.writeFileSync(path, buffer);
    this.fileMap.set(id, { path, expires: Date.now() + this.ttl });
    return id;
  }
  get(id) {
    const entry = this.fileMap.get(id);
    if (entry && import_node_fs.existsSync(entry.path)) {
      return entry.path;
    }
    return null;
  }
  delete(id) {
    const entry = this.fileMap.get(id);
    if (entry) {
      if (import_node_fs.existsSync(entry.path))
        import_node_fs.unlinkSync(entry.path);
      this.fileMap.delete(id);
    }
  }
  cleanup() {
    const now = Date.now();
    for (const [id, entry] of this.fileMap.entries()) {
      if (now > entry.expires) {
        this.delete(id);
      }
    }
  }
  destroy() {
    clearInterval(this.cleanupTimer);
    const ids = Array.from(this.fileMap.keys());
    for (let i = 0;i < ids.length; i++) {
      this.delete(ids[i]);
    }
  }
}

// packages/wire/src/adapters/http.ts
init_wire_broadcast();
var BLOCKED_SET_PATH_SEGMENTS2 = new Set([
  "__proto__",
  "constructor",
  "prototype"
]);
var RESERVED_REMOTE_ACTIONS = new Set([
  "constructor",
  "render",
  "mount",
  "unmount",
  "view",
  "fill",
  "validate",
  "rule",
  "getPublicState"
]);
function normalizeRoute(route) {
  const value2 = String(route || "/_wire").trim();
  if (!value2)
    return "/_wire";
  const withSlash = value2.startsWith("/") ? value2 : `/${value2}`;
  return withSlash.replace(/\/+$/, "");
}

class HttpAdapter extends Adapter {
  static DEFAULT_MAX_UPLOAD_BYTES = 64 * 1024 * 1024;
  static MAX_UPLOAD_ERROR_PREFIX = "KIREWIRE_UPLOAD_TOO_LARGE";
  static SOCKET_MARKER = "SocketClientAdapter";
  static HTTP_MARKER = "HttpClientAdapter";
  static clientScriptCache = null;
  route;
  fileStore;
  ownsFileStore;
  maxUploadBytes;
  constructor(options = {}) {
    super();
    this.route = normalizeRoute(options.route || "/_wire");
    this.fileStore = options.fileStore || new FileStore(options.tempDir || "node_modules/.kirewire_uploads");
    this.ownsFileStore = !options.fileStore;
    this.maxUploadBytes = this.normalizeMaxUploadBytes(options.maxUploadBytes);
  }
  setup() {
    console.log(`[Kirewire] HttpAdapter active on ${this.route}`);
    this.wire.reference("wire:url", () => this.getClientUrl());
    this.wire.reference("wire:upload-url", () => this.getUploadUrl());
    this.wire.reference("wire:preview-url", () => this.getPreviewUrl());
    this.wire.reference("wire:sse-url", () => `${this.route}/sse`);
    this.wire.reference("wire:session-url", () => `${this.route}/session`);
    this.wire.reference("wire:client-script-url", () => `${this.route}/kirewire.js`);
  }
  getClientUrl() {
    return this.route;
  }
  getUploadUrl() {
    return `${this.route}/upload`;
  }
  getPreviewUrl() {
    return `${this.route}/preview`;
  }
  async handleRequest(req, userId, sessionId) {
    const url = new URL(req.url, "http://localhost");
    if (req.method === "GET" && url.pathname === `${this.route}/kirewire.js`) {
      return this.handleClientScript();
    }
    if (req.method === "POST" && url.pathname === `${this.route}/upload`) {
      return await this.handleUpload(req.body);
    }
    if (req.method === "GET" && url.pathname === `${this.route}/preview`) {
      return this.handlePreview(url);
    }
    if (!this.wire) {
      return {
        status: 500,
        headers: { "Content-Type": "application/json" },
        result: {
          error: "HttpAdapter is not installed. Call adapter.install(wire, kire) first."
        }
      };
    }
    const customRoute = this.wire.matchRoute(req.method, url.pathname);
    if (customRoute) {
      return await this.handleCustomRoute(customRoute, req, url, userId, sessionId);
    }
    if (req.method === "POST" && url.pathname === `${this.route}/live/init`) {
      return await this.handleLiveInit(req.body, userId, sessionId);
    }
    if (req.method === "POST" && url.pathname === `${this.route}/live/save`) {
      return await this.handleLiveSave(req.body, userId, sessionId);
    }
    if (req.method === "GET" && url.pathname === `${this.route}/sse`) {
      const pageId2 = String(url.searchParams.get("pageId") || "");
      return this.handleSse(req, userId, pageId2, sessionId);
    }
    if (req.method === "GET" && url.pathname === `${this.route}/session`) {
      const pageId2 = String(url.searchParams.get("pageId") || "");
      const querySessionId = String(url.searchParams.get("sessionId") || sessionId || "");
      return this.handleSessionStatus(userId, pageId2, querySessionId);
    }
    if (req.method !== "POST") {
      return { status: 405, result: { error: "Method not allowed" } };
    }
    const reqBody = req.body;
    if (!reqBody)
      return { status: 400, result: { error: "Empty request body" } };
    const actions = reqBody.batch && Array.isArray(reqBody.batch) ? reqBody.batch : [reqBody];
    const pageId = String(reqBody.pageId || actions[0]?.pageId || "default-page");
    const results = [];
    const modifiedComponents = new Set;
    const preparedComponents = new Set;
    const touchedBroadcastRooms = new Set;
    const modifiedRefs = new Set;
    for (let i = 0;i < actions.length; i++) {
      const action = actions[i];
      try {
        const { id, method, params } = action;
        const page = this.wire.sessions.getPage(userId, pageId, sessionId);
        const instance = page.components.get(id);
        if (!instance) {
          console.error(`[HttpAdapter] Component ${id} not found for userId=${userId} pageId=${pageId}. Available components in this page:`, Array.from(page.components.keys()));
          throw new Error(`Component ${id} not found.`);
        }
        if (!preparedComponents.has(id)) {
          preparedComponents.add(id);
          if (instance.$clearEffects)
            instance.$clearEffects();
        }
        await this.invokeComponentAction(instance, method, params);
        modifiedComponents.add(id);
        results.push({ id, success: true });
      } catch (e) {
        results.push({ id: action?.id, error: e?.message || "Unknown error" });
      }
    }
    for (const id of modifiedComponents) {
      const page = this.wire.sessions.getPage(userId, pageId, sessionId);
      const instance = page.components.get(id);
      if (!instance)
        continue;
      const payload = await this.renderComponentPayload(id, instance);
      const roomIds = this.getBroadcastRoomIds(instance);
      for (let j = 0;j < roomIds.length; j++)
        touchedBroadcastRooms.add(roomIds[j]);
      await this.wire.emit("component:update", {
        userId,
        sessionId,
        pageId,
        id,
        ...payload
      });
      modifiedRefs.add(this.buildComponentRef(userId, sessionId, pageId, id));
      for (let i = results.length - 1;i >= 0; i--) {
        if (results[i].id === id && !results[i].error) {
          Object.assign(results[i], {
            effects: instance.__effects,
            state: payload.state,
            html: payload.html,
            revision: payload.revision
          });
          break;
        }
      }
    }
    if (touchedBroadcastRooms.size > 0) {
      await this.emitBroadcastUpdatesForAllPages({
        roomIds: touchedBroadcastRooms,
        skipRefs: modifiedRefs
      });
    }
    return {
      status: 200,
      headers: { "Content-Type": "application/json" },
      result: reqBody.batch ? results : results[0]
    };
  }
  async handleCustomRoute(route, req, url, userId, sessionId) {
    try {
      const output = await route.handler({
        method: req.method,
        path: url.pathname,
        url,
        query: url.searchParams,
        params: route.params,
        body: req.body,
        signal: req.signal,
        userId,
        sessionId,
        wire: this.wire,
        adapter: this
      });
      if (output && typeof output === "object" && (("status" in output) || ("result" in output) || ("headers" in output))) {
        const typed = output;
        return {
          status: Number(typed.status || 200),
          headers: typed.headers,
          result: typed.result
        };
      }
      return {
        status: 200,
        headers: { "Content-Type": "application/json" },
        result: output
      };
    } catch (error3) {
      return {
        status: 500,
        headers: { "Content-Type": "application/json" },
        result: {
          route: route.name,
          error: String(error3?.message || "Internal error")
        }
      };
    }
  }
  async handleLiveInit(body, userId, sessionId) {
    const componentName = String(body?.name || "").trim();
    if (!componentName) {
      return {
        status: 400,
        headers: { "Content-Type": "application/json" },
        result: { error: "Live component name is required." }
      };
    }
    const ComponentClass = this.wire.components.get(componentName);
    if (!ComponentClass) {
      return {
        status: 404,
        headers: { "Content-Type": "application/json" },
        result: { error: `Component "${componentName}" not found.` }
      };
    }
    const pageId = String(body?.pageId || "default-page");
    const locals = body?.locals && typeof body.locals === "object" ? body.locals : {};
    try {
      const page = this.wire.sessions.getPage(userId, pageId, sessionId);
      const id = this.wire.createComponentId();
      const instance = new ComponentClass;
      instance.$id = id;
      instance.$kire = this.kire;
      instance.$wire_instance = this.wire;
      instance.$wire_scope_id = sessionId;
      const listenerCleanup = this.wire.bindComponentListeners(instance, {
        userId,
        pageId,
        id
      });
      this.wire.attachLifecycleGuards(instance, listenerCleanup);
      this.wire.applySafeLocals(instance, locals);
      await instance.mount();
      page.components.set(id, instance);
      const state = typeof instance.getPublicState === "function" ? instance.getPublicState() : {};
      return {
        status: 200,
        headers: { "Content-Type": "application/json" },
        result: {
          id,
          state,
          ready: true
        }
      };
    } catch (error3) {
      return {
        status: 500,
        headers: { "Content-Type": "application/json" },
        result: {
          error: String(error3?.message || "Failed to init live component.")
        }
      };
    }
  }
  async handleLiveSave(body, userId, sessionId) {
    const id = String(body?.id || "").trim();
    if (!id) {
      return {
        status: 400,
        headers: { "Content-Type": "application/json" },
        result: { error: "Live component id is required." }
      };
    }
    const pageId = String(body?.pageId || "default-page");
    const page = this.wire.sessions.getPage(userId, pageId, sessionId);
    const instance = page.components.get(id);
    if (!instance) {
      return {
        status: 404,
        headers: { "Content-Type": "application/json" },
        result: { error: `Component ${id} not found.` }
      };
    }
    const nextState = body?.state && typeof body.state === "object" ? body.state : {};
    if (typeof instance.$clearEffects === "function") {
      instance.$clearEffects();
    }
    const keys = Object.keys(nextState);
    for (let i = 0;i < keys.length; i++) {
      const key = keys[i];
      if (!this.isWritableSetPath(instance, key))
        continue;
      const value2 = nextState[key];
      instance.$set(key, value2);
      await this.runUpdatedHooks(instance, key, value2);
    }
    const payload = await this.renderComponentPayload(id, instance);
    await this.wire.emit("component:update", {
      userId,
      sessionId,
      pageId,
      id,
      ...payload
    });
    return {
      status: 200,
      headers: { "Content-Type": "application/json" },
      result: payload
    };
  }
  async handleUpload(body) {
    const files = this.extractFilesFromBody(body);
    if (!files.length) {
      return { status: 400, result: { error: "No files uploaded" } };
    }
    const uploaded = [];
    for (let i = 0;i < files.length; i++) {
      const raw = files[i];
      const file = this.normalizeUploadFile(raw);
      const name = String(file.name || "upload.bin");
      const mime = String(file.mime || "application/octet-stream");
      let buffer;
      try {
        buffer = await this.readUploadBuffer(file.source, this.maxUploadBytes);
      } catch (error3) {
        if (this.isUploadTooLargeError(error3)) {
          return {
            status: 413,
            result: {
              error: String(error3?.message || "Uploaded file is too large.")
            }
          };
        }
        return {
          status: 400,
          result: {
            error: String(error3?.message || "Unable to read uploaded file.")
          }
        };
      }
      if (!buffer) {
        return {
          status: 400,
          result: { error: `Unable to read uploaded file "${name}".` }
        };
      }
      const size = buffer.length || Number(file.size || 0);
      let id;
      try {
        id = this.fileStore.store(name, buffer);
      } catch (error3) {
        return {
          status: 500,
          result: {
            error: `Failed to store uploaded file "${name}". ${String(error3?.message || "")}`.trim()
          }
        };
      }
      uploaded.push({ id, name, size, mime, type: mime });
    }
    return { status: 200, result: { files: uploaded } };
  }
  handlePreview(url) {
    const id = String(url.searchParams.get("id") || "").trim();
    if (!id) {
      return {
        status: 400,
        headers: { "Content-Type": "application/json" },
        result: { error: "Preview id is required." }
      };
    }
    const filePath = this.fileStore.get(id);
    if (!filePath || !import_node_fs2.existsSync(filePath)) {
      return {
        status: 404,
        headers: { "Content-Type": "application/json" },
        result: { error: "Preview file not found." }
      };
    }
    const ext = filePath.split(".").pop()?.toLowerCase() || "";
    const typeByExt = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
      pdf: "application/pdf",
      txt: "text/plain; charset=utf-8",
      ogg: "audio/ogg",
      mp3: "audio/mpeg",
      wav: "audio/wav",
      m4a: "audio/mp4",
      mp4: "video/mp4",
      webm: "video/webm"
    };
    return {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": typeByExt[ext] || "application/octet-stream",
        "X-Content-Type-Options": "nosniff"
      },
      result: import_node_fs2.createReadStream(filePath)
    };
  }
  extractFilesFromBody(body) {
    if (!body)
      return [];
    if (typeof FormData !== "undefined" && body instanceof FormData) {
      return [...body.getAll("files[]"), ...body.getAll("files")].filter(Boolean);
    }
    if (body && typeof body === "object") {
      const candidates = [body["files[]"], body.files, body.file];
      const out = [];
      for (let i = 0;i < candidates.length; i++) {
        const c = candidates[i];
        if (!c)
          continue;
        if (Array.isArray(c)) {
          for (let j = 0;j < c.length; j++) {
            const item = c[j];
            if (!item)
              continue;
            if (item && typeof item === "object" && "value" in item && item.value) {
              out.push(item.value);
              continue;
            }
            out.push(item);
          }
          continue;
        }
        if (c && typeof c === "object" && "value" in c && c.value) {
          out.push(c.value);
          continue;
        }
        out.push(c);
      }
      return out.filter(Boolean);
    }
    return [];
  }
  normalizeUploadFile(file) {
    if (file && typeof file === "object" && "value" in file && file.value) {
      return this.normalizeUploadFile(file.value);
    }
    return {
      name: String(file?.name || file?.filename || "upload.bin"),
      mime: String(file?.type || file?.mime || file?.mimetype || "application/octet-stream"),
      size: Number(file?.size || 0),
      source: file
    };
  }
  async readUploadBuffer(file, maxBytes) {
    if (!file || typeof file !== "object")
      return null;
    const enforceLimit = (bytes) => {
      if (!Number.isFinite(maxBytes) || maxBytes <= 0)
        return;
      if (bytes <= maxBytes)
        return;
      throw new Error(`${HttpAdapter.MAX_UPLOAD_ERROR_PREFIX}: Uploaded file exceeds the maximum allowed size (${maxBytes} bytes).`);
    };
    const declaredSize = Number(file.size || 0);
    if (Number.isFinite(declaredSize) && declaredSize > 0) {
      enforceLimit(declaredSize);
    }
    if (typeof file.arrayBuffer === "function") {
      const data = await file.arrayBuffer();
      enforceLimit(data?.byteLength || 0);
      return Buffer.from(data);
    }
    if (typeof file.toBuffer === "function") {
      const data = await file.toBuffer();
      const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
      enforceLimit(buffer.length);
      return buffer;
    }
    if (Buffer.isBuffer(file.buffer)) {
      enforceLimit(file.buffer.length);
      return file.buffer;
    }
    const stream = file.file;
    if (stream && typeof stream[Symbol.asyncIterator] === "function") {
      const chunks = [];
      let total = 0;
      for await (const chunk of stream) {
        let normalized = null;
        if (Buffer.isBuffer(chunk))
          normalized = chunk;
        else if (chunk)
          normalized = Buffer.from(chunk);
        if (!normalized)
          continue;
        total += normalized.length;
        enforceLimit(total);
        chunks.push(normalized);
      }
      return chunks.length > 0 ? Buffer.concat(chunks) : null;
    }
    return null;
  }
  async invokeComponentAction(instance, method, params) {
    const name = String(method || "").trim();
    const callParams = Array.isArray(params) ? params : [];
    if (name === "$set") {
      const property = String(callParams[0] ?? "").trim();
      const value2 = callParams[1];
      if (!this.isWritableSetPath(instance, property)) {
        throw new Error(`Property "${property}" is not writable.`);
      }
      instance.$set(property, value2);
      await this.runUpdatedHooks(instance, property, value2);
      return;
    }
    if (name === "$refresh" || name === "$commit") {
      return;
    }
    if (!name) {
      throw new Error("Action method is required.");
    }
    if (name.startsWith("_")) {
      throw new Error(`Method "${name}" is not callable.`);
    }
    if (name.startsWith("$")) {
      throw new Error(`Internal method "${name}" is not callable.`);
    }
    if (!this.isAllowedActionMethod(instance, name)) {
      throw new Error(`Method "${name}" is not callable.`);
    }
    await instance[name](...callParams);
  }
  isAllowedActionMethod(instance, name) {
    if (!instance || !name)
      return false;
    if (RESERVED_REMOTE_ACTIONS.has(name))
      return false;
    if (typeof instance[name] !== "function")
      return false;
    const exposed = instance.$actions;
    if (Array.isArray(exposed) && exposed.length > 0) {
      return exposed.includes(name);
    }
    if (Object.hasOwn(instance, name)) {
      return true;
    }
    let proto = Object.getPrototypeOf(instance);
    while (proto && proto !== Object.prototype) {
      if (Object.hasOwn(proto, name)) {
        return proto !== Component.prototype;
      }
      proto = Object.getPrototypeOf(proto);
    }
    return false;
  }
  isWritableSetPath(instance, property) {
    const normalized = String(property || "").trim();
    if (!normalized)
      return false;
    if (typeof instance?.$canSet === "function") {
      try {
        return !!instance.$canSet(normalized);
      } catch {
        return false;
      }
    }
    const segments = normalized.split(".").map((part) => part.trim()).filter(Boolean);
    if (segments.length === 0)
      return false;
    for (let i = 0;i < segments.length; i++) {
      if (BLOCKED_SET_PATH_SEGMENTS2.has(segments[i]))
        return false;
    }
    const root = segments[0];
    const first = root.charCodeAt(0);
    if (first === 36 || first === 95)
      return false;
    if (typeof instance?.getPublicState === "function") {
      const state = instance.getPublicState();
      return Object.hasOwn(state, root);
    }
    return true;
  }
  async runUpdatedHooks(instance, property, value2) {
    if (!instance || !property)
      return;
    const callHook = async (hookName, args2) => {
      if (!hookName)
        return;
      const fn2 = instance[hookName];
      if (typeof fn2 !== "function")
        return;
      await fn2.apply(instance, args2);
    };
    const toStudly = (raw) => String(raw || "").split(/[\s._-]+/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("");
    const rootProperty = property.split(".")[0] || property;
    const fullPathHook = `updated${toStudly(property)}`;
    const rootHook = `updated${toStudly(rootProperty)}`;
    await callHook(fullPathHook, [value2, property]);
    if (rootHook !== fullPathHook) {
      await callHook(rootHook, [value2, property]);
    }
    await callHook("updated", [value2, property]);
  }
  handleSse(req, userId, pageId, sessionId) {
    const encoder = new TextEncoder;
    const stream = new ReadableStream({
      start: (controller) => {
        const send = (data) => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}

`));
          } catch (_e) {}
        };
        controller.enqueue(encoder.encode(`: connected

`));
        const cleanup = this.wire.on("component:update", (data) => {
          if (data.userId !== userId)
            return;
          if (sessionId && data.sessionId && data.sessionId !== sessionId)
            return;
          if (pageId && data.pageId !== pageId)
            return;
          send({ type: "update", ...data });
        });
        const keepAlive = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`: keep-alive

`));
          } catch (_e) {
            clearInterval(keepAlive);
            cleanup();
          }
        }, 15000);
        req.signal?.addEventListener("abort", () => {
          clearInterval(keepAlive);
          cleanup();
          try {
            controller.close();
          } catch (_e) {}
        });
      }
    });
    return {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive"
      },
      result: stream
    };
  }
  handleSessionStatus(userId, pageId, sessionId) {
    const sessionKey = String(sessionId || userId || "").trim();
    const active = this.wire.sessions.hasActiveSession(sessionKey);
    const pageActive = pageId ? this.wire.sessions.hasActivePage(sessionKey, pageId) : active;
    const status = active && pageActive ? 200 : 410;
    return {
      status,
      headers: { "Content-Type": "application/json" },
      result: {
        active,
        pageActive
      }
    };
  }
  async emitBroadcastUpdatesForAllPages(params) {
    const { roomIds, skipRefs } = params;
    const activePages = this.wire.sessions.getActivePages();
    for (let i = 0;i < activePages.length; i++) {
      const { userId, sessionId, pageId, page } = activePages[i];
      const entries = Array.from(page.components.entries());
      for (let j = 0;j < entries.length; j++) {
        const [id, instance] = entries[j];
        const ref3 = this.buildComponentRef(userId, sessionId, pageId, id);
        if (skipRefs.has(ref3))
          continue;
        const matchedRooms = this.getMatchingBroadcastRooms(instance, roomIds);
        if (matchedRooms.length === 0)
          continue;
        if (typeof instance.$clearEffects === "function")
          instance.$clearEffects();
        const typedInstance = instance;
        const keys = Object.keys(typedInstance);
        for (let k = 0;k < keys.length; k++) {
          const val = typedInstance[keys[k]];
          if (val instanceof WireBroadcast) {
            const roomId = val.getRoomId();
            if (roomIds.has(roomId)) {
              val.serverHydrate(instance);
            }
          }
        }
        const payload = await this.renderComponentPayload(id, instance);
        await this.wire.emit("component:update", {
          userId,
          sessionId,
          pageId,
          id,
          ...payload
        });
      }
    }
  }
  async renderComponentPayload(id, instance) {
    const nextRevision = Number(instance.__wireRevision || 0) + 1;
    instance.__wireRevision = nextRevision;
    const state = instance.getPublicState();
    const stateStr = JSON.stringify(state).replace(/'/g, "&#39;");
    const skipRender = Boolean(instance.__skipRender || instance.$live);
    instance.__skipRender = false;
    let html = "";
    if (!skipRender) {
      const rendered = await instance.render();
      html = `<div wire:id="${id}" wire:state='${stateStr}'>${rendered.toString()}</div>`;
    }
    return { html, state, effects: instance.__effects, revision: nextRevision };
  }
  getBroadcastRoomIds(instance) {
    const out = [];
    const keys = Object.keys(instance);
    for (let i = 0;i < keys.length; i++) {
      const value2 = instance[keys[i]];
      if (value2 instanceof WireBroadcast) {
        const roomId = value2.getRoomId();
        if (roomId)
          out.push(roomId);
      }
    }
    return out;
  }
  getMatchingBroadcastRooms(instance, roomIds) {
    const out = [];
    const keys = Object.keys(instance);
    for (let i = 0;i < keys.length; i++) {
      const value2 = instance[keys[i]];
      if (value2 instanceof WireBroadcast) {
        const roomId = value2.getRoomId();
        if (roomId && roomIds.has(roomId))
          out.push(roomId);
      }
    }
    return out;
  }
  buildComponentRef(userId, sessionId, pageId, id) {
    return `${userId}::${sessionId}::${pageId}::${id}`;
  }
  handleClientScript() {
    return {
      status: 200,
      headers: {
        "Content-Type": "text/javascript; charset=utf-8",
        "Cache-Control": "no-store"
      },
      result: this.getClientScriptSource()
    };
  }
  getClientScriptSource() {
    if (HttpAdapter.clientScriptCache)
      return HttpAdapter.clientScriptCache;
    const adapterDir = import_node_path2.dirname(import_node_url.fileURLToPath("file:///C:/Users/danie/Documents/GitHub/kire/packages/wire/src/adapters/http.ts"));
    const workspaceClient = this.findWorkspaceClientScript();
    const candidates = [
      workspaceClient,
      import_node_path2.resolve(adapterDir, "../../dist/client/wire.js"),
      import_node_path2.resolve(adapterDir, "../../client/wire.js"),
      import_node_path2.resolve(process.cwd(), "node_modules/@kirejs/wire/dist/client/wire.js"),
      import_node_path2.resolve(process.cwd(), "dist/client/wire.js"),
      import_node_path2.resolve(process.cwd(), "packages/wire/dist/client/wire.js"),
      import_node_path2.resolve(process.cwd(), "../packages/wire/dist/client/wire.js"),
      import_node_path2.resolve(process.cwd(), "../../packages/wire/dist/client/wire.js")
    ].filter((value2, index, list) => Boolean(value2) && list.indexOf(value2) === index);
    let fallback = null;
    for (let i = 0;i < candidates.length; i++) {
      const path = candidates[i];
      if (!import_node_fs2.existsSync(path))
        continue;
      try {
        const content = import_node_fs2.readFileSync(path, "utf8");
        if (!fallback)
          fallback = content;
        if (this.isSocketCapableClientScript(content)) {
          HttpAdapter.clientScriptCache = content;
          return content;
        }
      } catch {}
    }
    if (fallback) {
      HttpAdapter.clientScriptCache = fallback;
      return fallback;
    }
    console.error("[Kirewire] Client script not found. Expected dist/client/wire.js (tip: run `bun run build.ts` in packages/wire).");
    return `console.error("[Kirewire] Client script not found.");`;
  }
  isSocketCapableClientScript(content) {
    return content.includes(HttpAdapter.HTTP_MARKER) && content.includes(HttpAdapter.SOCKET_MARKER);
  }
  findWorkspaceClientScript() {
    let current = process.cwd();
    for (let i = 0;i < 8; i++) {
      const candidate = import_node_path2.resolve(current, "packages/wire/dist/client/wire.js");
      if (import_node_fs2.existsSync(candidate))
        return candidate;
      const parent = import_node_path2.resolve(current, "..");
      if (parent === current)
        break;
      current = parent;
    }
    return null;
  }
  destroy() {
    if (this.ownsFileStore && this.fileStore && typeof this.fileStore.destroy === "function") {
      this.fileStore.destroy();
    }
  }
  normalizeMaxUploadBytes(value2) {
    if (value2 === undefined || value2 === null) {
      return HttpAdapter.DEFAULT_MAX_UPLOAD_BYTES;
    }
    const parsed = Number(value2);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return Number.POSITIVE_INFINITY;
    }
    return Math.floor(parsed);
  }
  isUploadTooLargeError(error3) {
    const message2 = String(error3?.message || "");
    return message2.startsWith(HttpAdapter.MAX_UPLOAD_ERROR_PREFIX);
  }
}
// packages/wire/src/adapters/socket.ts
init_component();
init_wire_broadcast();
var BLOCKED_SET_PATH_SEGMENTS3 = new Set([
  "__proto__",
  "constructor",
  "prototype"
]);
var RESERVED_REMOTE_ACTIONS2 = new Set([
  "constructor",
  "render",
  "mount",
  "unmount",
  "view",
  "fill",
  "validate",
  "rule",
  "getPublicState"
]);
// packages/wire/src/adapters/fivem.ts
init_component();
init_wire_broadcast();
var BLOCKED_SET_PATH_SEGMENTS4 = new Set([
  "__proto__",
  "constructor",
  "prototype"
]);
var RESERVED_REMOTE_ACTIONS3 = new Set([
  "constructor",
  "render",
  "mount",
  "unmount",
  "view",
  "fill",
  "validate",
  "rule",
  "getPublicState"
]);
function normalizeRoute2(route) {
  const value2 = String(route || "/_wire").trim();
  if (!value2)
    return "/_wire";
  const withSlash = value2.startsWith("/") ? value2 : `/${value2}`;
  return withSlash.replace(/\/+$/, "");
}

class FiveMAdapter extends Adapter {
  route;
  fallbackHttp;
  inboundEvent;
  outboundEvent;
  resolveIdentity;
  emitToClient;
  lastSourceByUser = new Map;
  constructor(options = {}) {
    super();
    this.route = normalizeRoute2(options.route || "/_wire");
    this.fallbackHttp = new HttpAdapter({
      route: this.route,
      fileStore: options.fileStore,
      tempDir: options.tempDir,
      maxUploadBytes: options.maxUploadBytes
    });
    this.inboundEvent = String(options.inboundEvent || "kirewire:call");
    this.outboundEvent = String(options.outboundEvent || "kirewire:push");
    this.resolveIdentity = options.resolveIdentity;
    this.emitToClient = options.emit;
  }
  setup() {
    this.fallbackHttp.install(this.wire, this.kire);
    console.log(`[Kirewire] FiveMAdapter initialized on ${this.route}.`);
    this.wire.reference("wire:fivem:inbound-event", () => this.inboundEvent);
    this.wire.reference("wire:fivem:outbound-event", () => this.outboundEvent);
    this.wire.reference("wire:fivem:route", () => this.route);
    this.wire.on("component:update", (data) => {
      this.pushToClient(data.userId, "update", data, undefined, data.sessionId);
    });
  }
  getClientUrl() {
    return this.route;
  }
  getUploadUrl() {
    return `${this.route}/upload`;
  }
  getInboundEventName() {
    return this.inboundEvent;
  }
  getOutboundEventName() {
    return this.outboundEvent;
  }
  async handleRequest(req, userId, sessionId) {
    return this.fallbackHttp.handleRequest(req, userId, sessionId);
  }
  async onNetMessage(sourceId, message2) {
    const source = String(sourceId ?? "").trim();
    const identity = this.resolveIdentity?.(source) || {
      userId: source || "guest",
      sessionId: source || "guest"
    };
    return this.onMessage(source, identity.userId, identity.sessionId, message2);
  }
  async onMessage(sourceId, userId, sessionId, message2) {
    const source = String(sourceId || "").trim();
    const wireUserId = String(userId || "guest");
    if (source) {
      this.lastSourceByUser.set(wireUserId, source);
    }
    const event = String(message2?.event || "").trim();
    const payload = message2?.payload || {};
    if (event === "ping") {
      this.pushToClient(wireUserId, "pong", { at: Date.now() }, source, sessionId);
      return;
    }
    if (event !== "call")
      return;
    const actions = Array.isArray(payload?.batch) ? payload.batch : [payload];
    const pageId = String(payload?.pageId || actions[0]?.pageId || "default-page");
    const results = [];
    for (let i = 0;i < actions.length; i++) {
      const action = actions[i];
      const actionRequestId = String(action?.requestId || payload?.requestId || "");
      try {
        const result = await this.executeAction(wireUserId, sessionId, pageId, action);
        results.push({
          requestId: actionRequestId,
          ...result
        });
      } catch (error3) {
        results.push({
          requestId: actionRequestId,
          id: String(action?.id || ""),
          error: String(error3?.message || "Unknown FiveM call error")
        });
      }
    }
    if (Array.isArray(payload?.batch)) {
      this.pushToClient(wireUserId, "response", {
        requestId: String(payload?.requestId || ""),
        results
      }, source, sessionId);
      return;
    }
    const single = results[0] || {
      requestId: String(payload?.requestId || ""),
      id: String(actions[0]?.id || ""),
      error: "Unknown FiveM call error"
    };
    if (single.error) {
      this.pushToClient(wireUserId, "response", {
        requestId: single.requestId,
        id: single.id,
        error: single.error
      }, source, sessionId);
      return;
    }
    this.pushToClient(wireUserId, "response", {
      requestId: single.requestId,
      result: single
    }, source, sessionId);
  }
  async executeAction(userId, sessionId, pageId, action) {
    const id = String(action?.id || "").trim();
    if (!id)
      throw new Error("Component id is required.");
    const method = String(action?.method || "").trim();
    const params = Array.isArray(action?.params) ? action.params : [];
    const page = this.wire.sessions.getPage(userId, pageId, sessionId);
    const instance = page.components.get(id);
    if (!instance) {
      throw new Error(`Component ${id} not found.`);
    }
    if (typeof instance.$clearEffects === "function") {
      instance.$clearEffects();
    }
    await this.invokeComponentAction(instance, method, params);
    const payload = await this.renderComponentPayload(id, instance);
    const touchedBroadcastRooms = new Set(this.getBroadcastRoomIds(instance));
    const skipRefs = new Set([
      this.buildComponentRef(userId, sessionId, pageId, id)
    ]);
    await this.wire.emit("component:update", {
      userId,
      sessionId,
      pageId,
      id,
      ...payload
    });
    if (touchedBroadcastRooms.size > 0) {
      await this.emitBroadcastUpdatesForAllPages({
        roomIds: touchedBroadcastRooms,
        skipRefs
      });
    }
    return {
      id,
      success: true,
      html: payload.html,
      state: payload.state,
      effects: payload.effects,
      revision: payload.revision
    };
  }
  async invokeComponentAction(instance, method, params) {
    const name = String(method || "").trim();
    const callParams = Array.isArray(params) ? params : [];
    if (name === "$set") {
      const property = String(callParams[0] ?? "").trim();
      const value2 = callParams[1];
      if (!this.isWritableSetPath(instance, property)) {
        throw new Error(`Property "${property}" is not writable.`);
      }
      instance.$set(property, value2);
      await this.runUpdatedHooks(instance, property, value2);
      return;
    }
    if (name === "$refresh" || name === "$commit") {
      return;
    }
    if (!name) {
      throw new Error("Action method is required.");
    }
    if (name.startsWith("_")) {
      throw new Error(`Method "${name}" is not callable.`);
    }
    if (name.startsWith("$")) {
      throw new Error(`Internal method "${name}" is not callable.`);
    }
    if (!this.isAllowedActionMethod(instance, name)) {
      throw new Error(`Method "${name}" not found on component ${instance.$id}.`);
    }
    await instance[name](...callParams);
  }
  isAllowedActionMethod(instance, name) {
    if (!instance || !name)
      return false;
    if (RESERVED_REMOTE_ACTIONS3.has(name))
      return false;
    if (typeof instance[name] !== "function")
      return false;
    const exposed = instance.$actions;
    if (Array.isArray(exposed) && exposed.length > 0) {
      return exposed.includes(name);
    }
    if (Object.hasOwn(instance, name))
      return true;
    let proto = Object.getPrototypeOf(instance);
    while (proto && proto !== Object.prototype) {
      if (Object.hasOwn(proto, name)) {
        return proto !== Component.prototype;
      }
      proto = Object.getPrototypeOf(proto);
    }
    return false;
  }
  isWritableSetPath(instance, property) {
    const normalized = String(property || "").trim();
    if (!normalized)
      return false;
    if (typeof instance?.$canSet === "function") {
      try {
        return !!instance.$canSet(normalized);
      } catch {
        return false;
      }
    }
    const segments = normalized.split(".").map((part) => part.trim()).filter(Boolean);
    if (segments.length === 0)
      return false;
    for (let i = 0;i < segments.length; i++) {
      if (BLOCKED_SET_PATH_SEGMENTS4.has(segments[i]))
        return false;
    }
    const root = segments[0];
    const first = root.charCodeAt(0);
    if (first === 36 || first === 95)
      return false;
    if (typeof instance?.getPublicState === "function") {
      const state = instance.getPublicState();
      return Object.hasOwn(state, root);
    }
    return true;
  }
  async runUpdatedHooks(instance, property, value2) {
    if (!instance || !property)
      return;
    const callHook = async (hookName, args2) => {
      if (!hookName)
        return;
      const fn2 = instance[hookName];
      if (typeof fn2 !== "function")
        return;
      await fn2.apply(instance, args2);
    };
    const toStudly = (raw) => String(raw || "").split(/[\s._-]+/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("");
    const rootProperty = property.split(".")[0] || property;
    const fullPathHook = `updated${toStudly(property)}`;
    const rootHook = `updated${toStudly(rootProperty)}`;
    await callHook(fullPathHook, [value2, property]);
    if (rootHook !== fullPathHook) {
      await callHook(rootHook, [value2, property]);
    }
    await callHook("updated", [value2, property]);
  }
  async renderComponentPayload(id, instance) {
    const nextRevision = Number(instance.__wireRevision || 0) + 1;
    instance.__wireRevision = nextRevision;
    const state = instance.getPublicState();
    const stateStr = JSON.stringify(state).replace(/'/g, "&#39;");
    const skipRender = Boolean(instance.__skipRender || instance.$live);
    instance.__skipRender = false;
    let html = "";
    if (!skipRender) {
      const rendered = await instance.render();
      html = `<div wire:id="${id}" wire:state='${stateStr}'>${rendered.toString()}</div>`;
    }
    return { html, state, effects: instance.__effects, revision: nextRevision };
  }
  async emitBroadcastUpdatesForAllPages(params) {
    const { roomIds, skipRefs } = params;
    const activePages = this.wire.sessions.getActivePages();
    for (let i = 0;i < activePages.length; i++) {
      const { userId, sessionId, pageId, page } = activePages[i];
      const entries = Array.from(page.components.entries());
      for (let j = 0;j < entries.length; j++) {
        const [id, instance] = entries[j];
        const ref3 = this.buildComponentRef(userId, sessionId, pageId, id);
        if (skipRefs.has(ref3))
          continue;
        const matchedRooms = this.getMatchingBroadcastRooms(instance, roomIds);
        if (matchedRooms.length === 0)
          continue;
        if (typeof instance.$clearEffects === "function") {
          instance.$clearEffects();
        }
        const typedInstance = instance;
        const keys = Object.keys(typedInstance);
        for (let k = 0;k < keys.length; k++) {
          const val = typedInstance[keys[k]];
          if (val instanceof WireBroadcast) {
            const roomId = val.getRoomId();
            if (roomId && roomIds.has(roomId)) {
              val.serverHydrate(instance);
            }
          }
        }
        const payload = await this.renderComponentPayload(id, instance);
        await this.wire.emit("component:update", {
          userId,
          sessionId,
          pageId,
          id,
          ...payload
        });
      }
    }
  }
  getBroadcastRoomIds(instance) {
    const out = [];
    const keys = Object.keys(instance);
    for (let i = 0;i < keys.length; i++) {
      const value2 = instance[keys[i]];
      if (value2 instanceof WireBroadcast) {
        const roomId = value2.getRoomId();
        if (roomId)
          out.push(roomId);
      }
    }
    return out;
  }
  getMatchingBroadcastRooms(instance, roomIds) {
    const out = [];
    const keys = Object.keys(instance);
    for (let i = 0;i < keys.length; i++) {
      const value2 = instance[keys[i]];
      if (value2 instanceof WireBroadcast) {
        const roomId = value2.getRoomId();
        if (roomId && roomIds.has(roomId))
          out.push(roomId);
      }
    }
    return out;
  }
  buildComponentRef(userId, sessionId, pageId, id) {
    return `${userId}::${sessionId}::${pageId}::${id}`;
  }
  pushToClient(userId, event, data, sourceId, sessionId) {
    const resolvedUserId = String(userId || "guest");
    const targetSource = String(sourceId || this.lastSourceByUser.get(resolvedUserId) || "").trim();
    const packet = {
      userId: resolvedUserId,
      sessionId: String(sessionId || "").trim() || undefined,
      sourceId: targetSource || undefined,
      channel: this.outboundEvent,
      event: String(event || ""),
      data
    };
    if (typeof this.emitToClient === "function") {
      try {
        this.emitToClient(packet);
      } catch {}
    }
    this.wire.emitSync("fivem:push", packet);
  }
  disconnectSpecialProperties(instance) {
    const keys = Object.keys(instance);
    for (let i = 0;i < keys.length; i++) {
      const key = keys[i];
      const value2 = instance[key];
      if (!value2 || typeof value2 !== "object")
        continue;
      if (value2 instanceof WireBroadcast) {
        try {
          value2.disconnect(instance);
        } catch {}
      }
    }
  }
  destroy() {
    this.fallbackHttp.destroy();
    const activePages = this.wire.sessions.getActivePages();
    for (let i = 0;i < activePages.length; i++) {
      const page = activePages[i].page;
      const components = Array.from(page.components.values());
      for (let j = 0;j < components.length; j++) {
        this.disconnectSpecialProperties(components[j]);
      }
    }
  }
}
// packages/wire/src/index.ts
init_component();

// packages/wire/src/decorators.ts
init_metadata();

// packages/wire/src/index.ts
init_file_upload();
init_wire_broadcast();

// packages/wire/src/kirewire.ts
var import_node_crypto3 = require("node:crypto");

// packages/wire/src/event-controller.ts
class EventController {
  _listeners = Object.create(null);
  on(event, callback) {
    const names = event.includes(",") ? event.split(",") : [event];
    const unsubs = [];
    for (let i = 0;i < names.length; i++) {
      const name = names[i].trim();
      if (!this._listeners[name]) {
        this._listeners[name] = [];
      }
      const list = this._listeners[name];
      list.push(callback);
      unsubs.push(() => {
        const idx = list.indexOf(callback);
        if (idx !== -1)
          list.splice(idx, 1);
      });
    }
    return () => {
      for (let i = 0;i < unsubs.length; i++)
        unsubs[i]();
    };
  }
  async emit(event, data) {
    const list = this._listeners[event];
    if (!list || list.length === 0)
      return;
    const promises = [];
    for (let i = 0;i < list.length; i++) {
      const res = list[i](data);
      if (res instanceof Promise)
        promises.push(res);
    }
    if (promises.length > 0)
      await Promise.all(promises);
  }
  emitSync(event, data) {
    const list = this._listeners[event];
    if (!list)
      return;
    for (let i = 0;i < list.length; i++) {
      list[i](data);
    }
  }
  clear(event) {
    if (event) {
      delete this._listeners[event];
    } else {
      this._listeners = Object.create(null);
    }
  }
}

// packages/wire/src/kirewire.ts
init_metadata();

// packages/wire/src/session.ts
var import_node_crypto2 = require("node:crypto");

class SessionManager {
  expireMs;
  sessions = new Map;
  sessionKeyByUserId = new Map;
  findByPublicId = new Map;
  cleanupTimer;
  constructor(expireMs) {
    this.expireMs = expireMs;
    this.cleanupTimer = setInterval(() => this.cleanup(), 60000);
    if (typeof this.cleanupTimer?.unref === "function") {
      this.cleanupTimer.unref();
    }
  }
  getSession(userId, sessionId) {
    const normalizedUserId = this.normalizeUserId(userId);
    const sessionKey = this.resolveSessionKey(normalizedUserId, sessionId);
    let session = this.sessions.get(sessionKey);
    if (!session) {
      const publicId = import_node_crypto2.randomUUID();
      session = {
        key: sessionKey,
        publicId,
        pages: new Map,
        userIds: new Set,
        expireAt: Date.now() + this.expireMs
      };
      this.sessions.set(sessionKey, session);
      this.findByPublicId.set(publicId, sessionKey);
    }
    session.userIds.add(normalizedUserId);
    this.sessionKeyByUserId.set(normalizedUserId, sessionKey);
    session.expireAt = Date.now() + this.expireMs;
    return session;
  }
  getPage(userId, pageId, sessionId) {
    const session = this.getSession(userId, sessionId);
    const normalizedPageId = this.normalizePageId(pageId);
    let page = session.pages.get(normalizedPageId);
    if (!page) {
      page = {
        components: new Map,
        lastSeen: Date.now()
      };
      session.pages.set(normalizedPageId, page);
    }
    page.lastSeen = Date.now();
    return page;
  }
  hasActiveSession(userIdOrSessionId) {
    const session = this.findSession(userIdOrSessionId);
    if (!session)
      return false;
    if (session.expireAt && Date.now() > session.expireAt)
      return false;
    return true;
  }
  hasActivePage(userIdOrSessionId, pageId) {
    const session = this.findSession(userIdOrSessionId);
    if (!session)
      return false;
    if (session.expireAt && Date.now() > session.expireAt)
      return false;
    return session.pages.has(this.normalizePageId(pageId));
  }
  getUserIdByPublicId(publicId) {
    const sessionKey = this.findByPublicId.get(String(publicId || "").trim());
    if (!sessionKey)
      return;
    const session = this.sessions.get(sessionKey);
    if (!session || session.userIds.size === 0)
      return;
    return session.userIds.values().next().value;
  }
  getActivePages() {
    const entries = [];
    for (const [sessionId, session] of this.sessions.entries()) {
      const userId = session.userIds.values().next().value || "guest";
      for (const [pageId, page] of session.pages.entries()) {
        entries.push({ userId, sessionId, pageId, session, page });
      }
    }
    return entries;
  }
  async cleanup() {
    const now = Date.now();
    for (const [sessionKey, session] of this.sessions.entries()) {
      if (session.expireAt && now > session.expireAt) {
        for (const [_pageId, page] of session.pages.entries()) {
          await this.unmountPage(page);
        }
        this.deleteSession(sessionKey, session);
      }
    }
  }
  async unmountPage(page) {
    for (const component of page.components.values()) {
      try {
        await component.unmount();
      } catch (e) {
        console.error(`Error unmounting component ${component.$id}:`, e);
      }
    }
    page.components.clear();
  }
  async destroy() {
    clearInterval(this.cleanupTimer);
    for (const session of this.sessions.values()) {
      for (const page of session.pages.values()) {
        await this.unmountPage(page);
      }
    }
    this.sessions.clear();
    this.sessionKeyByUserId.clear();
    this.findByPublicId.clear();
  }
  findSession(userIdOrSessionId) {
    const raw = String(userIdOrSessionId || "").trim();
    if (!raw)
      return;
    const direct = this.sessions.get(raw);
    if (direct)
      return direct;
    const mapped3 = this.sessionKeyByUserId.get(raw);
    if (!mapped3)
      return;
    return this.sessions.get(mapped3);
  }
  resolveSessionKey(userId, sessionId) {
    const explicit = String(sessionId || "").trim();
    if (explicit) {
      const explicitSession = this.sessions.get(explicit);
      if (explicitSession)
        return explicit;
      const mapped4 = this.sessionKeyByUserId.get(userId);
      if (!mapped4)
        return explicit;
      if (mapped4 === explicit)
        return explicit;
      const mappedSession = this.sessions.get(mapped4);
      if (!mappedSession)
        return explicit;
      this.rekeySession(mapped4, explicit, mappedSession);
      return explicit;
    }
    const mapped3 = this.sessionKeyByUserId.get(userId);
    if (mapped3)
      return mapped3;
    return userId || "guest";
  }
  normalizeUserId(userId) {
    const value2 = String(userId || "").trim();
    return value2 || "guest";
  }
  normalizePageId(pageId) {
    const value2 = String(pageId || "").trim();
    return value2 || "default-page";
  }
  deleteSession(sessionKey, session) {
    this.sessions.delete(sessionKey);
    this.findByPublicId.delete(session.publicId);
    for (const userId of session.userIds.values()) {
      if (this.sessionKeyByUserId.get(userId) === sessionKey) {
        this.sessionKeyByUserId.delete(userId);
      }
    }
  }
  rekeySession(fromKey, toKey, session) {
    if (fromKey === toKey)
      return;
    this.sessions.delete(fromKey);
    session.key = toKey;
    this.sessions.set(toKey, session);
    this.findByPublicId.set(session.publicId, toKey);
    for (const userId of session.userIds.values()) {
      this.sessionKeyByUserId.set(userId, toKey);
    }
  }
}

// packages/wire/src/kirewire.ts
function normalizeRoutePath(path) {
  const value2 = String(path || "").trim();
  if (!value2)
    return "/";
  const withSlash = value2.startsWith("/") ? value2 : `/${value2}`;
  return withSlash.replace(/\/+$/, "") || "/";
}
function escapeRegex(value2) {
  return value2.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function compileRoute(path) {
  const normalized = normalizeRoutePath(path);
  const parts = normalized.split("/").filter(Boolean);
  const paramNames = [];
  const pattern2 = parts.map((part) => {
    if (part === "*") {
      paramNames.push("wildcard");
      return "(.*)";
    }
    if (part.startsWith(":")) {
      const key = part.slice(1).trim();
      paramNames.push(key || "param");
      return "([^/]+)";
    }
    return escapeRegex(part);
  }).join("/");
  const source = pattern2 ? `^/${pattern2}/?$` : "^/?$";
  return { matcher: new RegExp(source), paramNames };
}

class Kirewire extends EventController {
  options;
  components = new Map;
  propertyClasses = new Map;
  sessions;
  middlewares = [];
  references = new Map;
  routes = new Map;
  secret;
  constructor(options) {
    super();
    this.options = options;
    this.secret = options.secret;
    const expireMs = typeof options.expire_session === "string" ? this.parseDuration(options.expire_session) : options.expire_session || 60000;
    this.sessions = new SessionManager(expireMs);
  }
  class(name, PropertyClass) {
    this.propertyClasses.set(name, PropertyClass);
  }
  reference(name, value2) {
    const key = String(name || "").trim();
    if (!key)
      throw new Error("Wire reference name is required.");
    this.references.set(key, value2);
  }
  getReference(name, ctx = {}) {
    const key = String(name || "").trim();
    if (!key)
      return;
    const entry = this.references.get(key);
    if (entry === undefined)
      return;
    if (typeof entry === "function") {
      return String(entry({ wire: this, adapter: ctx.adapter }) || "");
    }
    return String(entry || "");
  }
  getReferences(ctx = {}) {
    const out = {};
    for (const [name] of this.references.entries()) {
      const value2 = this.getReference(name, ctx);
      if (value2 === undefined)
        continue;
      out[name] = value2;
    }
    return out;
  }
  route(name, config) {
    const key = String(name || "").trim();
    if (!key)
      throw new Error("Wire route name is required.");
    if (!config || typeof config.handler !== "function") {
      throw new Error(`Wire route "${key}" requires a handler.`);
    }
    const method = String(config.method || "GET").trim().toUpperCase();
    const path = normalizeRoutePath(config.path);
    const { matcher, paramNames } = compileRoute(path);
    this.routes.set(key, {
      name: key,
      method,
      path,
      paramNames,
      matcher,
      handler: config.handler
    });
  }
  removeRoute(name) {
    const key = String(name || "").trim();
    if (!key)
      return false;
    return this.routes.delete(key);
  }
  matchRoute(method, path) {
    const targetMethod = String(method || "").trim().toUpperCase();
    const targetPath = normalizeRoutePath(path);
    for (const route of this.routes.values()) {
      if (route.method !== targetMethod)
        continue;
      const match = route.matcher.exec(targetPath);
      if (!match)
        continue;
      const params = {};
      for (let i = 0;i < route.paramNames.length; i++) {
        const key = route.paramNames[i];
        params[key] = decodeURIComponent(match[i + 1] || "");
      }
      return {
        name: route.name,
        method: route.method,
        path: route.path,
        params,
        handler: route.handler
      };
    }
    return null;
  }
  createComponentId() {
    return import_node_crypto3.randomUUID();
  }
  wired(nameOrClass, ComponentClass) {
    let componentName = "";
    let klass;
    if (typeof nameOrClass === "function") {
      klass = nameOrClass;
      componentName = "";
    } else {
      componentName = String(nameOrClass || "").trim();
      klass = ComponentClass;
    }
    if (typeof klass !== "function") {
      throw new Error("Component class must be a class/function.");
    }
    const wireDefinition = getWireComponentDefinition(klass);
    const resolvedName = componentName || String(wireDefinition?.name || "").trim() || String(klass?.name || "").trim();
    const key = String(resolvedName || "").trim();
    if (!key)
      throw new Error("Component name is required.");
    if (wireDefinition?.live === true) {
      klass.prototype.$live = true;
    }
    this.components.set(key, klass);
    return this;
  }
  applySafeLocals(instance, locals = {}) {
    if (!instance || typeof instance !== "object")
      return;
    if (!locals || typeof locals !== "object")
      return;
    const keys = Object.keys(locals);
    for (let i = 0;i < keys.length; i++) {
      const key = keys[i];
      if (this.isBlockedLocalKey(key))
        continue;
      const current = instance[key];
      if (typeof current === "function")
        continue;
      if (current && typeof current === "object" && typeof current.hydrate === "function" && typeof current.dehydrate === "function") {
        current.hydrate(locals[key]);
        continue;
      }
      instance[key] = locals[key];
    }
  }
  bindComponentListeners(instance, context) {
    if (!instance || typeof instance !== "object")
      return () => {};
    const listeners = instance.listeners;
    if (!listeners || typeof listeners !== "object")
      return () => {};
    const cleanups = [];
    for (const [event, methodName] of Object.entries(listeners)) {
      const eventName = String(event || "").trim();
      const method = String(methodName || "").trim();
      if (!eventName || !method)
        continue;
      const off = this.on(`event:${eventName}`, async (data) => {
        if (data?.sourceId === context.id)
          return;
        const handler = instance[method];
        if (typeof handler !== "function")
          return;
        const params = Array.isArray(data?.params) ? data.params : [];
        if (typeof instance.$clearEffects === "function")
          instance.$clearEffects();
        await handler.apply(instance, params);
        const state = typeof instance.getPublicState === "function" ? instance.getPublicState() : {};
        const stateStr = this.serializeStateAttr(state);
        const skipRender = Boolean(instance.__skipRender);
        instance.__skipRender = false;
        let html = "";
        if (!skipRender) {
          const rendered = typeof instance.render === "function" ? await instance.render() : "";
          html = rendered?.toString ? rendered.toString() : String(rendered ?? "");
        }
        await this.emit("component:update", {
          userId: context.userId,
          pageId: context.pageId,
          id: context.id,
          html: skipRender ? "" : `<div wire:id="${context.id}" wire:state='${stateStr}'>${html}</div>`,
          state,
          effects: Array.isArray(instance.__effects) ? instance.__effects : []
        });
      });
      cleanups.push(off);
    }
    return () => {
      for (let i = 0;i < cleanups.length; i++) {
        try {
          cleanups[i]();
        } catch {}
      }
    };
  }
  attachLifecycleGuards(instance, cleanup) {
    if (!instance || typeof instance !== "object")
      return;
    const originalUnmount = typeof instance.unmount === "function" ? instance.unmount.bind(instance) : async () => {};
    let finalized = false;
    instance.unmount = async (...args2) => {
      if (finalized)
        return;
      finalized = true;
      if (typeof cleanup === "function") {
        try {
          cleanup();
        } catch {}
      }
      this.disconnectSpecialProperties(instance);
      await originalUnmount(...args2);
    };
  }
  generateChecksum(state, sessionId) {
    const data = JSON.stringify(state) + sessionId + this.secret;
    return import_node_crypto3.createHash("sha256").update(data).digest("hex");
  }
  use(fn2) {
    this.middlewares.push(fn2);
  }
  getCache() {
    return {
      components: this.components,
      propertyClasses: this.propertyClasses,
      sessions: this.sessions,
      references: this.references,
      routes: this.routes
    };
  }
  configureCache(next) {
    if (!next || typeof next !== "object")
      return this;
    if (next.components instanceof Map)
      this.components = next.components;
    if (next.propertyClasses instanceof Map)
      this.propertyClasses = next.propertyClasses;
    if (next.sessions instanceof SessionManager)
      this.sessions = next.sessions;
    if (next.references instanceof Map)
      this.references = next.references;
    if (next.routes instanceof Map)
      this.routes = next.routes;
    return this;
  }
  mutateCache(mutator) {
    if (typeof mutator !== "function")
      return this;
    mutator(this.getCache());
    return this;
  }
  async wireRegister(pattern2, rootDir = process.cwd(), namePrefix = "") {
    const { existsSync: existsSync3, readdirSync, statSync } = await import("node:fs");
    const { join: join2, resolve: resolve2, parse: parse4 } = await import("node:path");
    const { Component: Component2 } = await Promise.resolve().then(() => (init_component(), exports_component));
    const searchDir = resolve2(rootDir, pattern2.replace(/\*.*$/, ""));
    if (!existsSync3(searchDir))
      return;
    const walk = (dir) => {
      let results = [];
      try {
        const list = readdirSync(dir);
        for (let i = 0;i < list.length; i++) {
          const file = list[i];
          const path = join2(dir, file);
          const stat = statSync(path);
          if (stat?.isDirectory())
            results = results.concat(walk(path));
          else
            results.push(path);
        }
      } catch (_e) {}
      return results;
    };
    const files = walk(searchDir);
    for (let i = 0;i < files.length; i++) {
      const file = files[i];
      if ((file.endsWith(".js") || file.endsWith(".ts")) && !file.endsWith(".d.ts")) {
        try {
          const fullPath = resolve2(file);
          const module4 = await import(fullPath);
          const componentClass = module4.default || Object.values(module4).find((e) => typeof e === "function" && e.prototype instanceof Component2);
          if (componentClass) {
            const wireDefinition = getWireComponentDefinition(componentClass);
            const relPath = file.slice(searchDir.length + 1);
            const parsed = parse4(relPath);
            const dirParts = parsed.dir ? parsed.dir.split(/[\\/]/) : [];
            const localName = [...dirParts, parsed.name].join(".");
            const decoratedName = String(wireDefinition?.name || "").trim();
            const prefix = String(namePrefix || "").trim().replace(/\.+$/, "");
            const baseName = decoratedName || localName;
            const name = prefix ? `${prefix}.${baseName}` : baseName;
            if (wireDefinition?.live === true) {
              componentClass.prototype.$live = true;
            }
            this.components.set(name, componentClass);
            console.log(`[Kirewire] Registered component: ${name}`);
          }
        } catch (e) {
          console.error(`[Kirewire] Failed to register ${file}:`, e);
        }
      }
    }
  }
  serializeStateAttr(state) {
    try {
      return JSON.stringify(state ?? {}).replace(/'/g, "&#39;");
    } catch {
      return "{}";
    }
  }
  disconnectSpecialProperties(instance) {
    const keys = Object.keys(instance);
    for (let i = 0;i < keys.length; i++) {
      const key = keys[i];
      const value2 = instance[key];
      if (!value2 || typeof value2 !== "object")
        continue;
      if (value2.__wire_type === "broadcast" && typeof value2.disconnect === "function") {
        try {
          value2.disconnect(instance);
        } catch {}
      }
    }
  }
  isBlockedLocalKey(key) {
    if (!key)
      return true;
    if (key === "__proto__" || key === "prototype" || key === "constructor")
      return true;
    const first = key.charCodeAt(0);
    return first === 36 || first === 95;
  }
  parseDuration(duration) {
    const match = duration.match(/^(\d+)([smh])$/);
    if (!match)
      return 60000;
    const val = Number.parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case "s":
        return val * 1000;
      case "m":
        return val * 60000;
      case "h":
        return val * 3600000;
      default:
        return val;
    }
  }
  async destroy() {
    await this.sessions.destroy();
    this.clear();
    this.components.clear();
    this.propertyClasses.clear();
    this.references.clear();
    this.routes.clear();
  }
}

// packages/wire/src/index.ts
init_rule();

// examples/fivem-example/server.ts
var ROUTE_BASE = "/fivem-example";
var WIRE_ROUTE = "/_wire";
var PAGE_ID_DEFAULT = "fivem-example-page";
var COUNTER_COMPONENT_ID = "counter-demo";
var RESOURCE_NAME = typeof GetCurrentResourceName === "function" ? String(GetCurrentResourceName() || "fivem-example") : "fivem-example";
var RESOURCE_ROOT = typeof GetResourcePath === "function" ? String(GetResourcePath(RESOURCE_NAME) || process.cwd()) : process.cwd();
var LOCAL_KIREWIRE_CLIENT = import_node_path3.default.join(RESOURCE_ROOT, "client", "kirewire.js");

class DemoCounter extends Component {
  count = 0;
  async increment() {
    this.count += 1;
  }
  async decrement() {
    this.count -= 1;
  }
  async reset() {
    this.count = 0;
  }
  render() {
    return `
            <div class="panel">
                <h1>KireWire FiveM (Koa)</h1>
                <p class="count">Count: <strong>${this.count}</strong></p>

                <div class="actions">
                    <button type="button" wire:click="decrement">-</button>
                    <button type="button" wire:click="increment">+</button>
                    <button type="button" wire:click="reset">Reset</button>
                </div>
            </div>
        `;
  }
}
var wire = new Kirewire({ secret: "fivem-example-secret" });
var adapter = new FiveMAdapter({
  route: WIRE_ROUTE,
  tempDir: import_node_path3.default.join(RESOURCE_ROOT, ".kirewire_uploads"),
  resolveIdentity: (sourceId) => {
    const id = String(sourceId || "").trim();
    return {
      userId: id || "guest",
      sessionId: id || "guest"
    };
  },
  emit: (packet) => {
    const target = String(packet.sourceId || packet.userId || "").trim();
    if (!target)
      return;
    const payload = {
      event: packet.event,
      payload: packet.data
    };
    emitToClient(packet.channel, target, payload);
  }
});
adapter.install(wire, {});
async function ensureDemoComponent(userId, pageId) {
  const safeUserId = String(userId || "guest").trim() || "guest";
  const safePageId = String(pageId || PAGE_ID_DEFAULT).trim() || PAGE_ID_DEFAULT;
  const page = wire.sessions.getPage(safeUserId, safePageId);
  let instance = page.components.get(COUNTER_COMPONENT_ID);
  if (instance)
    return instance;
  instance = new DemoCounter;
  instance.$id = COUNTER_COMPONENT_ID;
  instance.$wire_instance = wire;
  await instance.mount();
  page.components.set(COUNTER_COMPONENT_ID, instance);
  return instance;
}
async function renderCounterRoot(userId, pageId) {
  const instance = await ensureDemoComponent(userId, pageId);
  const state = instance.getPublicState();
  const stateAttr = JSON.stringify(state).replace(/'/g, "&#39;");
  const inner = String(await instance.render());
  return `<div wire:id="${COUNTER_COMPONENT_ID}" wire:state='${stateAttr}'>${inner}</div>`;
}
function buildHtmlPage(pageId, rootHtml) {
  const scriptConfig = {
    pageId,
    url: WIRE_ROUTE,
    uploadUrl: `${WIRE_ROUTE}/upload`,
    transport: "fivem",
    busDelay: 40
  };
  return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="kirewire:page-id" content="${escapeHtmlAttr(pageId)}" />
    <meta name="kirewire:url" content="${WIRE_ROUTE}" />
    <meta name="kirewire:upload-url" content="${WIRE_ROUTE}/upload" />
    <meta name="kirewire:transport" content="fivem" />
    <meta name="kirewire:bus-delay" content="40" />
    <title>KireWire FiveM Example</title>
    <style>
        :root {
            color-scheme: dark;
        }
        html,
        body {
            width: 100%;
            min-height: 100%;
            background: transparent !important;
            background-color: transparent !important;
        }
        * {
            box-sizing: border-box;
        }
        body {
            margin: 0;
            min-height: 100vh;
            font-family: "Segoe UI", Tahoma, sans-serif;
            display: grid;
            place-items: center;
            color: #e9f1ff;
            overflow: hidden;
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            transition: opacity .12s ease;
        }
        body.nui-visible {
            opacity: 1;
            visibility: visible;
            pointer-events: auto;
        }
        body.nui-hidden {
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
        }
        #kirewire-nui-root {
            pointer-events: auto;
        }
        .panel {
            width: min(92vw, 500px);
            border: 1px solid rgba(153, 175, 214, 0.24);
            background: rgba(11, 15, 26, 0.72);
            border-radius: 16px;
            padding: 22px;
            box-shadow: 0 22px 80px rgba(0, 0, 0, 0.35);
            pointer-events: auto;
        }
        h1 {
            margin: 0 0 10px;
            font-size: 1.15rem;
            letter-spacing: 0.02em;
        }
        .count {
            margin: 0;
            color: rgba(235, 242, 255, 0.88);
        }
        .actions {
            margin-top: 16px;
            display: flex;
            gap: 10px;
        }
        button {
            border: 0;
            border-radius: 10px;
            padding: 10px 14px;
            font-weight: 700;
            cursor: pointer;
            background: #1d293e;
            color: #f4f8ff;
            transition: transform .08s ease, background-color .18s ease;
        }
        button:hover {
            background: #273a5d;
        }
        button:active {
            transform: translateY(1px);
        }
        .debug-hint {
            position: fixed;
            right: 18px;
            bottom: 18px;
            z-index: 50;
            border: 1px solid rgba(153, 175, 214, 0.3);
            background: rgba(11, 15, 26, 0.82);
            color: rgba(228, 237, 255, 0.9);
            border-radius: 10px;
            padding: 8px 10px;
            font-size: 12px;
            letter-spacing: 0.02em;
            pointer-events: none;
        }
        .debug-menu {
            position: fixed;
            top: 18px;
            right: 18px;
            z-index: 60;
            width: min(92vw, 320px);
            border: 1px solid rgba(153, 175, 214, 0.35);
            background: rgba(9, 13, 22, 0.92);
            border-radius: 14px;
            padding: 14px;
            box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
            pointer-events: auto;
        }
        .debug-menu[hidden] {
            display: none !important;
        }
        .debug-title {
            margin: 0;
            font-size: 14px;
            font-weight: 700;
            letter-spacing: 0.02em;
        }
        .debug-subtitle {
            margin: 6px 0 0;
            color: rgba(228, 237, 255, 0.72);
            font-size: 12px;
        }
        .debug-status {
            margin-top: 12px;
            font-size: 12px;
            color: #b9caf1;
            min-height: 18px;
        }
        .debug-status.error {
            color: #ffb0b0;
        }
        .debug-badges {
            margin-top: 10px;
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }
        .debug-badge {
            display: inline-flex;
            align-items: center;
            border-radius: 999px;
            padding: 4px 8px;
            font-size: 11px;
            background: #24334f;
            color: #ebf2ff;
        }
        .debug-badge.ok {
            background: #1f4733;
            color: #c9f2db;
        }
        .debug-actions {
            margin-top: 12px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
        }
        .debug-actions button {
            width: 100%;
            padding: 8px 10px;
            font-size: 12px;
            border-radius: 8px;
        }
        .debug-close {
            grid-column: 1 / -1;
        }
    </style>
    <script type="module" src="${WIRE_ROUTE}/kirewire.js"></script>
    <script type="module">
        window.__WIRE_INITIAL_CONFIG__ = Object.assign({}, window.__WIRE_INITIAL_CONFIG__ || {}, ${JSON.stringify(scriptConfig)});
        let attempts = 0;
        const start = () => {
            if (window.Kirewire && window.Alpine) {
                if (window.Kirewire.configure) {
                    window.Kirewire.configure(window.__WIRE_INITIAL_CONFIG__);
                }
                window.Kirewire.start(window.Alpine);
                return;
            }
            attempts += 1;
            setTimeout(start, Math.min(220, 20 + attempts * 8));
        };
        start();
    </script>
</head>
<body class="nui-hidden">
    <div id="kirewire-nui-root">${rootHtml}</div>
    <div class="debug-hint">M: abrir UI | H: menu debug</div>
    <aside id="kirewire-debug-menu" class="debug-menu" hidden>
        <h2 class="debug-title">KireWire Debug Menu</h2>
        <p class="debug-subtitle">Pressione <strong>H</strong> para abrir/fechar</p>
        <div id="kirewire-debug-status" class="debug-status">Menu pronto para teste.</div>
        <div class="debug-badges">
            <span id="kirewire-runtime-badge" class="debug-badge">runtime: checking...</span>
            <span id="kirewire-component-badge" class="debug-badge">component: checking...</span>
        </div>
        <div class="debug-actions">
            <button type="button" data-kirewire-action="increment">+ Increment</button>
            <button type="button" data-kirewire-action="decrement">- Decrement</button>
            <button type="button" data-kirewire-action="reset">Reset</button>
            <button type="button" data-kirewire-action="probe">Probe</button>
            <button type="button" class="debug-close" data-kirewire-action="close-menu">Fechar Menu (H)</button>
        </div>
    </aside>
    <script>
        (() => {
            const debugMenu = document.getElementById("kirewire-debug-menu");
            const debugStatus = document.getElementById("kirewire-debug-status");
            const runtimeBadge = document.getElementById("kirewire-runtime-badge");
            const componentBadge = document.getElementById("kirewire-component-badge");
            const componentSelector = '[wire\\\\:id="${COUNTER_COMPONENT_ID}"], [wire-id="${COUNTER_COMPONENT_ID}"]';
            let menuVisible = false;
            let uiVisible = false;

            const setVisible = (visible) => {
                uiVisible = Boolean(visible);
                document.body.classList.toggle("nui-visible", uiVisible);
                document.body.classList.toggle("nui-hidden", !uiVisible);
                if (!uiVisible) setMenuVisible(false);
            };

            const setStatus = (message, isError = false) => {
                if (!debugStatus) return;
                debugStatus.textContent = String(message || "");
                debugStatus.classList.toggle("error", Boolean(isError));
            };

            const findCounterRoot = () => {
                return document.querySelector(componentSelector);
            };

            const updateDiagnostics = () => {
                const hasRuntime = Boolean(window.Kirewire && typeof window.Kirewire.call === "function");
                const hasComponent = Boolean(findCounterRoot());

                if (runtimeBadge) {
                    runtimeBadge.textContent = hasRuntime ? "runtime: ok" : "runtime: missing";
                    runtimeBadge.classList.toggle("ok", hasRuntime);
                }

                if (componentBadge) {
                    componentBadge.textContent = hasComponent ? "component: ok" : "component: missing";
                    componentBadge.classList.toggle("ok", hasComponent);
                }
            };

            const setMenuVisible = (visible) => {
                menuVisible = Boolean(visible);
                if (debugMenu) debugMenu.hidden = !menuVisible;
                updateDiagnostics();
            };

            const callWireMethod = async (method) => {
                if (!uiVisible) {
                    setStatus("Abra a UI com M antes de testar.", true);
                    return;
                }

                const root = findCounterRoot();
                const runtime = window.Kirewire;
                if (!root || !runtime || typeof runtime.call !== "function") {
                    setStatus("Runtime/componente indisponivel.", true);
                    updateDiagnostics();
                    return;
                }

                try {
                    await runtime.call(root, method, []);
                    setStatus("Acao executada: " + method);
                } catch (error) {
                    const message = error && error.message ? error.message : String(error || "erro desconhecido");
                    setStatus("Falha na acao " + method + ": " + message, true);
                }

                updateDiagnostics();
            };

            const isTypingTarget = (target) => {
                if (!target || !(target instanceof Element)) return false;
                if (target instanceof HTMLInputElement) return true;
                if (target instanceof HTMLTextAreaElement) return true;
                if (target instanceof HTMLSelectElement) return true;
                return Boolean(target.closest("[contenteditable=''], [contenteditable='true']"));
            };

            window.addEventListener("message", (event) => {
                const data = event && event.data;
                if (!data || typeof data !== "object") return;
                if (data.__kirewire_ui === true) {
                    setVisible(Boolean(data.visible));
                    return;
                }
                if (data.__kirewire_menu === true) {
                    setMenuVisible(Boolean(data.visible));
                    return;
                }
                if (data.__kirewire_menu_toggle === true) {
                    setMenuVisible(!menuVisible);
                }
            });

            document.addEventListener("click", (event) => {
                const target = event.target;
                if (!(target instanceof Element)) return;
                const button = target.closest("[data-kirewire-action]");
                if (!(button instanceof HTMLElement)) return;

                const action = String(button.getAttribute("data-kirewire-action") || "").trim();
                if (!action) return;

                if (action === "close-menu") {
                    setMenuVisible(false);
                    setStatus("Menu fechado.");
                    return;
                }

                if (action === "probe") {
                    updateDiagnostics();
                    setStatus("Probe executado.");
                    return;
                }

                void callWireMethod(action);
            });

            window.addEventListener("keydown", (event) => {
                if (event.repeat) return;
                if (isTypingTarget(event.target)) return;

                const key = String(event.key || "").toLowerCase();
                if (key !== "h") return;

                event.preventDefault();
                setMenuVisible(!menuVisible);
                setStatus(menuVisible ? "Menu aberto." : "Menu fechado.");
            });

            setVisible(false);
            updateDiagnostics();
        })();
    </script>
</body>
</html>`;
}
function escapeHtmlAttr(value2) {
  return String(value2 || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function emitToClient(eventName, target, payload) {
  if (typeof emitNet === "function") {
    emitNet(eventName, target, payload);
    return;
  }
  if (typeof TriggerClientEvent === "function") {
    TriggerClientEvent(eventName, target, payload);
  }
}
function resolveHttpUserId(ctx) {
  const queryUserId = String(ctx.query.userId || "").trim();
  if (queryUserId)
    return queryUserId;
  const headerUserId = String(ctx.get("x-cfx-source") || ctx.get("x-citizenfx-source") || ctx.get("x-source") || "").trim();
  return headerUserId || "guest";
}
function resolvePageId(payload) {
  const batch = Array.isArray(payload?.batch) ? payload.batch : [];
  const candidate = String(payload?.pageId || batch[0]?.pageId || PAGE_ID_DEFAULT).trim();
  return candidate || PAGE_ID_DEFAULT;
}
function parseRequestBody(ctx) {
  const method = String(ctx.method || "GET").toUpperCase();
  if (method === "GET" || method === "HEAD") {
    return;
  }
  const request = ctx.req;
  const rawBody = typeof request?.rawBody === "string" ? request.rawBody : "";
  if (!rawBody)
    return;
  const contentType = String(ctx.get("content-type") || "").toLowerCase();
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(rawBody);
    } catch {
      return;
    }
  }
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const search = new URLSearchParams(rawBody);
    const out = {};
    for (const [key, value2] of search.entries()) {
      out[key] = value2;
    }
    return out;
  }
  return rawBody;
}
function applyAdapterResult(ctx, result) {
  ctx.status = Number(result?.status || 200);
  const headers = result?.headers;
  if (headers && typeof headers === "object") {
    const entries = Object.entries(headers);
    for (let i = 0;i < entries.length; i++) {
      const [name, value2] = entries[i];
      if (value2 === undefined || value2 === null)
        continue;
      ctx.set(name, String(value2));
    }
  }
  const payload = result?.result;
  if (payload === undefined || payload === null) {
    ctx.body = "";
    return;
  }
  if (typeof import_node_stream.Readable.fromWeb === "function" && payload instanceof ReadableStream) {
    ctx.body = import_node_stream.Readable.fromWeb(payload);
    return;
  }
  ctx.body = payload;
}
var app = new koa_default;
var router = new import_koa_router.default;
async function renderExamplePage(ctx) {
  const userId = resolveHttpUserId(ctx);
  const pageId = String(ctx.query.pageId || PAGE_ID_DEFAULT).trim() || PAGE_ID_DEFAULT;
  const rootHtml = await renderCounterRoot(userId, pageId);
  ctx.status = 200;
  ctx.type = "text/html; charset=utf-8";
  ctx.body = buildHtmlPage(pageId, rootHtml);
}
router.get(["/", "/index.html", ROUTE_BASE, `${ROUTE_BASE}/`], renderExamplePage);
router.get(`${WIRE_ROUTE}/kirewire.js`, (ctx) => {
  if (!import_node_fs3.existsSync(LOCAL_KIREWIRE_CLIENT)) {
    ctx.status = 500;
    ctx.type = "application/json; charset=utf-8";
    ctx.body = {
      error: "Local wire client not found.",
      expected: LOCAL_KIREWIRE_CLIENT
    };
    return;
  }
  ctx.status = 200;
  ctx.type = "text/javascript; charset=utf-8";
  ctx.set("Cache-Control", "no-store");
  ctx.body = import_node_fs3.readFileSync(LOCAL_KIREWIRE_CLIENT, "utf8");
});
router.all(/^\/_wire(?:\/.*)?$/, async (ctx) => {
  const userId = resolveHttpUserId(ctx);
  const sessionId = userId;
  const pageId = String(ctx.query.pageId || PAGE_ID_DEFAULT).trim() || PAGE_ID_DEFAULT;
  await ensureDemoComponent(userId, pageId);
  const url = `${ctx.protocol}://${ctx.host}${ctx.originalUrl}`;
  const result = await adapter.handleRequest({
    method: String(ctx.method || "GET").toUpperCase(),
    url,
    body: parseRequestBody(ctx)
  }, userId, sessionId);
  applyAdapterResult(ctx, result);
});
app.use(async (ctx, next) => {
  ctx.set("Cache-Control", "no-store");
  await next();
});
app.use(router.routes());
app.use(router.allowedMethods());
app.use((ctx) => {
  ctx.status = 404;
  ctx.type = "application/json; charset=utf-8";
  ctx.body = {
    error: "Route not found.",
    path: ctx.path
  };
});
import_http_wrapper.setHttpCallback(app.callback());
onNet(adapter.getInboundEventName(), async (packet) => {
  const sourceId = String(globalThis.source || "").trim();
  if (!sourceId)
    return;
  const payload = packet?.payload || {};
  const pageId = resolvePageId(payload);
  await ensureDemoComponent(sourceId, pageId);
  await adapter.onNetMessage(sourceId, packet);
});
console.log("[Kirewire][FiveM Example] Koa + router ready.");
console.log(`[Kirewire][FiveM Example] HTTP route: ${ROUTE_BASE}/`);
console.log(`[Kirewire][FiveM Example] Net events: ${adapter.getInboundEventName()} -> ${adapter.getOutboundEventName()}`);
