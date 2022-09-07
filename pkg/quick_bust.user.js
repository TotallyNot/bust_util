// ==UserScript==
// @name         Quick Bust
// @namespace    https://elimination.me/
// @version      1.2.0
// @description  Torn Quick Bust
// @author       Pyrit [2111649]
// @match        https://www.torn.com/jailview.php*
// @run-at       document-start
// @grant        GM_getResourceURL
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        unsafeWindow
// @resource     wasm https://raw.githubusercontent.com/TotallyNot/bust_util/master/pkg/bust_util_bg.wasm#sha384=ef4537983e4130d0e8973f964c180b15d415e42589494321cf78ab3e4911918d0bb82b6ccad8710808963a5c02d2307f
// @require      https://raw.githubusercontent.com/TotallyNot/bust_util/master/pkg/bust_util.js#sha384=48f44e5f7995f27c2343f0e2a9391e3be71b8509ace83088806632eb553e525601aa35988ea732e19e0daf395fb3b49c
// @updateURL    https://raw.githubusercontent.com/TotallyNot/bust_util/master/pkg/quick_bust.user.js
// ==/UserScript==

const base64 = GM_getResourceURL("wasm").slice(24);
const binaryString = atob(base64);
const bytes = Uint8Array.from(binaryString, (c) => c.charCodeAt(0));

const wasm_module = wasm_bindgen(bytes);

GM_addStyle(`
.quick-bust-icon {
    font-size: 18px;
    position: absolute;
    margin: 10px 0px 0px 2px;
    color: red;
}
.quick-bust-box {
    padding: 8px 6px 8px 4px;
    border-radius: 5px;
    display: flex;
    align-items: center;
}
.quick-bust-box > label {
    display: inline-block;
    padding-right: 10px;
    white-space: nowrap;
}
.quick-bust-box > label > input {
    vertical-align: middle;
}
.quick-bust-box > label > span {
    vertical-align: middle;
}
.quick-bust-title {
    flex-grow: 1;
    font-weight: bold;
}
#quick-bust-reload {
    font-size: 24px;
    text-decoration: none;
    padding: 0;
    margin: -12px 0px -10px;
    color: var(--default-color);
}
@media screen and (min-width: 800px) {
    #quick-bust-reload {
        display: none;
    }
}
`);

const state = { ...GM_getValue("state", {}), fetching: false, mounted: false };

let $user_info_wrap,
    $user_title_wrap,
    $msg_info_wrap,
    $msg_empty_info_wrap,
    $pagination_wrap,
    $parent;

const updateList = async () => {
    if (state.fetching) return;
    state.fetching = true;

    const start = new URLSearchParams(location.hash.slice(1)).get("start") ?? 0;
    $user_title_wrap.show();
    $user_info_wrap.html(
        '<li class="last"><span class="ajax-preloader m-top10 m-bottom10"></span></li>'
    );

    await wasm_module;
    const { process_jail_info } = wasm_bindgen;

    const params = new URLSearchParams();
    params.set("start", start);
    params.set("action", "jail");
    params.set("rfcv", "undefined");
    params.set(new Date().getTime(), Math.random());
    const url = `/jailview.php?${params.toString()}`;

    const response = await fetch(url, {
        headers: {
            "X-Requested-With": "XMLHttpRequest",
        },
    });

    let responseText = await response.text();
    const now = Date.now();
    const data = process_jail_info(
        responseText,
        state.quickBust ?? false,
        state.quickBail ?? false
    );
    console.log(`Processing jail payload took ${Date.now() - now}ms`);

    if (!data.total) {
        $user_title_wrap.hide();
    }

    $msg_info_wrap.html(data.info_text);
    $msg_empty_info_wrap.html(data.info_empty);
    $parent.find(".total").text(data.total);
    $parent.find(".aux-verb").text(data.total > 1 ? "People are" : "Person is");
    $pagination_wrap.html(data.pagination ? data.pagination : "");
    $user_info_wrap.empty().append(data.list);
    paginationUpdate();
    state.fetching = false;
};

const mountSettings = () => {
    state.mounted = true;
    $msg_info_wrap.after(
        `<div class="cont-gray quick-bust-box">
    <span class="quick-bust-title">Quick Bust Script</span>
    <label for="quick-bail">
        <span>Quick Bail</span>
        <input type="checkbox" id="quick-bail" ${
            state.quickBail ? "checked" : ""
        } />
    </label>
    <label for="quick-bust">
        <span>Quick Bust</span>
        <input type="checkbox" id="quick-bust" ${
            state.quickBust ? "checked" : ""
        } />
    </label>
    <button id="quick-bust-reload">&#10227;</button>
</div>`
    );

    $("#quick-bail").click((event) => {
        state.quickBail = event.target.checked;
        GM_setValue("state", state);
        updateList();
    });
    $("#quick-bust").click((event) => {
        state.quickBust = event.target.checked;
        GM_setValue("state", state);
        updateList();
    });
    $("#quick-bust-reload").click(() => updateList());
};

const origOpen = XMLHttpRequest.prototype.open;
unsafeWindow.XMLHttpRequest.prototype.open = function (
    _method,
    url,
    _async,
    _user,
    _password
) {
    if (url.indexOf("/jailview.php") !== -1 && url.indexOf("action") === -1) {
        $user_info_wrap = $(".user-info-list-wrap");
        $user_title_wrap = $(".users-list-title");
        $msg_info_wrap = $(".msg-info-wrap");
        $msg_empty_info_wrap = $(".msg-empty-info-wrap");
        $pagination_wrap = $(".pagination-wrap");
        $parent = $(".userlist-wrapper");

        if (!state.mounted) {
            mountSettings();
        }

        updateList();

        throw new Error("Abort");
    }
    return origOpen.apply(this, arguments);
};

document.addEventListener("keydown", (event) => {
    if (event.key === "r" && !event.repeat) {
        updateList();
    }
});
