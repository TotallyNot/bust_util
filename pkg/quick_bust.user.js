// ==UserScript==
// @name         Quick Bust
// @namespace    https://elimination.me/
// @version      1.0.3
// @description  Torn Quick Bust
// @author       Pyrit [2111649]
// @match        https://www.torn.com/jailview.php*
// @run-at       document-start
// @grant        GM_getResourceURL
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        unsafeWindow
// @resource     wasm https://raw.githubusercontent.com/TotallyNot/bust_util/master/pkg/bust_util_bg.wasm#sha384=a597ad020ce334aaa4e9c12b94e3b13ad3b077fc89626ece9486ef2d71bf79e855a9d73c64334d8797121eb727974e17
// @require      https://raw.githubusercontent.com/TotallyNot/bust_util/master/pkg/util.js#sha384=d55d68f45f24b0ec4ae8cffd8bf6427cbdd541286683cc542340ba93a517a5ea0e41905ba515a9079c74a120502da8fd
// @updateURL    https://raw.githubusercontent.com/TotallyNot/bust_util/master/pkg/quick_bust.user.js
// ==/UserScript==

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

    const { process_jail_info } = await util;

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
