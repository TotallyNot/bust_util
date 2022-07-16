//! Test suite for the Web and headless browsers.

#![cfg(target_arch = "wasm32")]

extern crate wasm_bindgen_test;
use bust_util::Payload;
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
