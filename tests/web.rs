//! Test suite for the Web and headless browsers.

#![cfg(target_arch = "wasm32")]

extern crate wasm_bindgen_test;
use bust_util::{process_jail_info, Payload};
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
fn decode() {
    let bytes = include_bytes!("./payload.json");
    let res = serde_json::from_slice::<Payload>(bytes);
    assert!(
        res.is_ok(),
        "Decoding failed with error: {:?}",
        res.unwrap_err()
    );
}

#[wasm_bindgen_test]
fn template() {
    let payload = include_str!("./payload.json");

    let res = process_jail_info(payload, true, true);

    assert!(res.is_ok(), "Rendering template failed with error",);
}
