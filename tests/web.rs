//! Test suite for the Web and headless browsers.

#![cfg(target_arch = "wasm32")]

extern crate wasm_bindgen_test;
use bust_util::{ListContext, Payload, TEMPLATES};
use tera::Context;
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
    let bytes = include_bytes!("./payload.json");
    let payload = serde_json::from_slice::<Payload>(bytes).unwrap();

    let context = ListContext {
        players: payload.data.players,
        quick_bust: false,
        quick_bail: false,
    };

    let res = TEMPLATES.render("jail_list", &Context::from_serialize(&context).unwrap());

    assert!(
        res.is_ok(),
        "Rendering template failed with error: {:?}",
        res.unwrap_err()
    );
}
