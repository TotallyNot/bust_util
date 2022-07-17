mod utils;

use indoc::indoc;
use std::borrow::Cow;
use std::collections::BTreeMap;
use std::rc::Rc;

use lazy_static::lazy_static;
use serde::{Deserialize, Serialize};
use tera::{Context, Tera};
use wasm_bindgen::prelude::*;

const TEMPLATE: &'static str = indoc! {r#"
    {% if quick_bust -%}
        {% set bust_step = "breakout1" -%}
    {% else -%}
        {% set bust_step = "breakout" -%}
    {% endif -%}
    {% if quick_bail -%}
        {% set bail_step = "buy1" -%}
    {% else -%}
        {% set bail_step = "buy" -%}
    {% endif -%}
    {% for player in players -%}
        {% if loop.last -%}
            <li class="last">
        {% else -%}
            <li>
        {% endif -%}
            {{ player.online_offline | safe }}
            {{ player.print_tag | safe }}
            {{ player.print_name | safe }}
            <span class="info-wrap">
                <span class="time">
                    <span class="title bold">
                        TIME
                        <span>:</span>
                    </span>
                    {{ player.time }}
                </span>
                <span class="level">
                    <span class="title bold">
                        LEVEL
                        <span>:</span>
                    </span>
                    {{ player.level }}
                </span>
                <span class="reason">
                    {{ player.jailreason }}
                </span>
            </span>
            <a class="bye t-gray-3" href="jailview.php?XID={{ player.user_id }}&action=rescue&step={{ bail_step }}">
                <span class="bye-icon"></span>
                <span class="title bold">BUY</span>
                {% if quick_bail -%}
                    <span class="quick-bust-icon">&curarrm;</span>
                {% endif -%}
            </a>
            <a class="bust t-gray-3" href="jailview.php?XID={{ player.user_id }}&action=rescue&step={{ bust_step }}">
                <span class="bust-icon"></span>
                <span class="title bold">BUST</span>
                {% if quick_bust -%}
                    <span class="quick-bust-icon">&curarrm;</span>
                {% endif -%}
            </a>
            <div class="confirm-bye"></div>
            <div class="confirm-bust"></div>
            <div class="bottom-white"></div>
        </li>
    {% endfor %}
"#};

lazy_static! {
    pub static ref TEMPLATES: Tera = {
        let mut tera = Tera::default();
        tera.add_raw_template("jail_list", TEMPLATE).unwrap();
        tera
    };
}

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
    pub pagination: Option<Cow<'a, str>>,

    #[serde(borrow)]
    pub players: Vec<Rc<Player<'a>>>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Payload<'a> {
    #[serde(borrow)]
    pub data: Data<'a>,
    pub success: bool,
}

#[derive(Serialize)]
pub struct ListContext<'a> {
    pub players: Vec<Rc<Player<'a>>>,
    pub quick_bust: bool,
    pub quick_bail: bool,
}

#[derive(Serialize)]
pub struct ListResponse<'a> {
    pub list: String,
    pub is_player_exist: bool,
    pub is_user_text_name: bool,
    pub total: &'a str,

    #[serde(borrow)]
    pub info_text: Cow<'a, str>,
    #[serde(borrow)]
    pub pagination: Option<Cow<'a, str>>,
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
pub fn process_jail_info(
    data: &str,
    quick_bust: bool,
    quick_bail: bool,
) -> Result<JsValue, JsError> {
    let payload: Payload =
        serde_json::from_str(data).map_err(|e| JsError::new(&format!("{:?}", e)))?;

    let mut score_map = BTreeMap::<u32, Rc<Player>>::new();

    for player in payload.data.players.iter() {
        if let Some(mut score) = player.score() {
            while score_map.contains_key(&score) {
                score += 1;
            }
            score_map.insert(score, player.clone());
        }
    }

    let players = score_map.into_values().collect();
    let context = ListContext {
        players,
        quick_bust,
        quick_bail,
    };
    let list = TEMPLATES
        .render("jail_list", &Context::from_serialize(&context).unwrap())
        .map_err(|e| JsError::new(&format!("{:?}", e)))?;

    let response = ListResponse {
        list,
        is_player_exist: payload.data.is_player_exist,
        is_user_text_name: payload.data.is_user_text_name,
        total: payload.data.total,
        info_text: payload.data.info_text,
        pagination: payload.data.pagination,
    };

    Ok(JsValue::from_serde(&response).unwrap())
}
