const util = new Promise(async (resolve) => {
    let wasm;

    const lTextDecoder =
        typeof TextDecoder === "undefined"
            ? (0, module.require)("util").TextDecoder
            : TextDecoder;

    let cachedTextDecoder = new lTextDecoder("utf-8", {
        ignoreBOM: true,
        fatal: true,
    });

    cachedTextDecoder.decode();

    let cachedUint8Memory0;
    function getUint8Memory0() {
        if (cachedUint8Memory0.byteLength === 0) {
            cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
        }
        return cachedUint8Memory0;
    }

    function getStringFromWasm0(ptr, len) {
        return cachedTextDecoder.decode(
            getUint8Memory0().subarray(ptr, ptr + len)
        );
    }

    const heap = new Array(32).fill(undefined);

    heap.push(undefined, null, true, false);

    let heap_next = heap.length;

    function addHeapObject(obj) {
        if (heap_next === heap.length) heap.push(heap.length + 1);
        const idx = heap_next;
        heap_next = heap[idx];

        heap[idx] = obj;
        return idx;
    }

    let WASM_VECTOR_LEN = 0;

    const lTextEncoder =
        typeof TextEncoder === "undefined"
            ? (0, module.require)("util").TextEncoder
            : TextEncoder;

    let cachedTextEncoder = new lTextEncoder("utf-8");

    const encodeString =
        typeof cachedTextEncoder.encodeInto === "function"
            ? function (arg, view) {
                  return cachedTextEncoder.encodeInto(arg, view);
              }
            : function (arg, view) {
                  const buf = cachedTextEncoder.encode(arg);
                  view.set(buf);
                  return {
                      read: arg.length,
                      written: buf.length,
                  };
              };

    function passStringToWasm0(arg, malloc, realloc) {
        if (realloc === undefined) {
            const buf = cachedTextEncoder.encode(arg);
            const ptr = malloc(buf.length);
            getUint8Memory0()
                .subarray(ptr, ptr + buf.length)
                .set(buf);
            WASM_VECTOR_LEN = buf.length;
            return ptr;
        }

        let len = arg.length;
        let ptr = malloc(len);

        const mem = getUint8Memory0();

        let offset = 0;

        for (; offset < len; offset++) {
            const code = arg.charCodeAt(offset);
            if (code > 0x7f) break;
            mem[ptr + offset] = code;
        }

        if (offset !== len) {
            if (offset !== 0) {
                arg = arg.slice(offset);
            }
            ptr = realloc(ptr, len, (len = offset + arg.length * 3));
            const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
            const ret = encodeString(arg, view);

            offset += ret.written;
        }

        WASM_VECTOR_LEN = offset;
        return ptr;
    }

    let cachedInt32Memory0;
    function getInt32Memory0() {
        if (cachedInt32Memory0.byteLength === 0) {
            cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
        }
        return cachedInt32Memory0;
    }

    function getObject(idx) {
        return heap[idx];
    }

    function dropObject(idx) {
        if (idx < 36) return;
        heap[idx] = heap_next;
        heap_next = idx;
    }

    function takeObject(idx) {
        const ret = getObject(idx);
        dropObject(idx);
        return ret;
    }

    const exports = {
        /**
         * @param {string} data
         * @param {boolean} quick_bust
         * @param {boolean} quick_bail
         * @returns {any}
         */
        process_jail_info(data, quick_bust, quick_bail) {
            try {
                const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
                const ptr0 = passStringToWasm0(
                    data,
                    wasm.__wbindgen_malloc,
                    wasm.__wbindgen_realloc
                );
                const len0 = WASM_VECTOR_LEN;
                wasm.process_jail_info(
                    retptr,
                    ptr0,
                    len0,
                    quick_bust,
                    quick_bail
                );
                var r0 = getInt32Memory0()[retptr / 4 + 0];
                var r1 = getInt32Memory0()[retptr / 4 + 1];
                var r2 = getInt32Memory0()[retptr / 4 + 2];
                if (r2) {
                    throw takeObject(r1);
                }
                return takeObject(r0);
            } finally {
                wasm.__wbindgen_add_to_stack_pointer(16);
            }
        },
    };

    const imports = {
        __wbindgen_error_new(arg0, arg1) {
            const ret = new Error(getStringFromWasm0(arg0, arg1));
            return addHeapObject(ret);
        },

        __wbindgen_json_parse(arg0, arg1) {
            const ret = JSON.parse(getStringFromWasm0(arg0, arg1));
            return addHeapObject(ret);
        },
    };

    const base64 = GM_getResourceURL("wasm").slice(24);
    const binaryString = atob(base64);
    const bytes = Uint8Array.from(binaryString, (c) => c.charCodeAt(0));

    const { instance } = await WebAssembly.instantiate(bytes, {
        "./bust_util_bg.js": imports,
    });

    wasm = instance.exports;
    cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
    cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);

    resolve(exports);
});
