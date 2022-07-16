mod utils;

use std::borrow::Cow;

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[derive(Serialize, Deserialize, Debug)]
pub struct Player<'a> {
    #[serde(borrow)]
    pub jailreason: Cow<'a, str>,
    #[serde(borrow)]
    pub online_offline: Cow<'a, str>,
    #[serde(borrow)]
    pub print_name: Cow<'a, str>,
    #[serde(borrow)]
    pub print_tag: Cow<'a, str>,

    pub time: &'a str,
    pub level: &'a str,
    pub user_id: &'a str,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Data<'a> {
    pub is_player_exist: bool,
    pub is_user_text_name: bool,
    pub total: &'a str,

    #[serde(borrow)]
    pub info_text: Cow<'a, str>,
    #[serde(borrow)]
    pub pagination: Cow<'a, str>,

    #[serde(borrow)]
    pub players: Vec<Player<'a>>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Payload<'a> {
    #[serde(borrow)]
    pub data: Data<'a>,
    pub success: bool,
}

#[wasm_bindgen]
pub fn process_jail_info(data: &str) -> Result<String, String> {
    let payload: Payload = serde_json::from_str(data).map_err(|e| format!("{:?}", e))?;

    serde_json::to_string(&payload).map_err(|e| format!("{:?}", e))
}
