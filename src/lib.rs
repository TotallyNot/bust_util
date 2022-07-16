mod utils;

use std::borrow::Cow;
use std::collections::BTreeMap;
use std::rc::Rc;

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
    pub players: Vec<Rc<Player<'a>>>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Payload<'a> {
    #[serde(borrow)]
    pub data: Data<'a>,
    pub success: bool,
}

fn parse_time_string(time: &str) -> Option<u32> {
    let mut time_split = time.trim_end().rsplit(' ');
    let first_part = time_split.next()?;

    let mut seconds = first_part[0..first_part.len() - 1].parse::<u32>().ok()?
        * match first_part.chars().last()? {
            'm' => 60,
            'h' => 3600,
            _ => return None,
        };

    if let Some(second_part) = time_split.next() {
        seconds += second_part[0..second_part.len() - 1].parse::<u32>().ok()? * 3600;
    }

    Some(seconds)
}

impl<'a> Player<'a> {
    fn score(&self) -> Option<u32> {
        let seconds = parse_time_string(self.time)?;
        Some((seconds + 3 * 3600) * self.level.parse::<u32>().ok()?)
    }
}

#[wasm_bindgen]
pub fn process_jail_info(data: &str) -> Result<String, String> {
    let mut payload: Payload = serde_json::from_str(data).map_err(|e| format!("{:?}", e))?;

    let mut score_map = BTreeMap::<u32, Rc<Player>>::new();

    for player in payload.data.players.iter() {
        if let Some(mut score) = player.score() {
            while score_map.contains_key(&score) {
                score += 1;
            }
            score_map.insert(score, player.clone());
        }
    }

    payload.data.players = score_map.into_values().collect();

    serde_json::to_string(&payload).map_err(|e| format!("{:?}", e))
}
