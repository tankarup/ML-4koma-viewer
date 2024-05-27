//https://www.koreyome.com/make-spreadsheet-to-json-at-google-apps-script/

let data = []; //全データ
let current_list = []; //現在表示中のデータ
let idol_list = [];
let drawer_list = [];
let series_list = [];
let keywords_list = [];
let idol1 = '';
let idol2 = '';
let drawer = '';
let series = '';
let keywords = '';
//let main_only = false;
let page = 0;
let viewing_koma = 0;
let number_per_page = 4;
let number_menu_columns = 3;
let icon_size = 64;

class Favs {
	constructor(items){
		this.favs = new Set(items);
	}
	add(item){
		this.favs.add(item);
		this.save();
	}
	delete(item){
		this.favs.delete(item);
		this.save();
	}
	has(item){
		return this.favs.has(item);
	}
	values(){
		return this.favs.values();
	}
	entries(){
		return this.favs.entries();
	}
	load(){
		this.favs = new Set(JSON.parse(localStorage.getItem('4koma_favs')));
	}
	save(){
		localStorage.setItem('4koma_favs', JSON.stringify(Array.from(this.favs)));
	}
}
const favs = new Favs();
favs.load();

// ページ読み込み後の処理
window.onload = function () {
    // 【main-script】 を実行
    getJsonp_GAS();

	const width = document.documentElement.clientWidth;

	//スクリーンサイズによってアイドル選択メニューを調整
    if (width >= 768){
		icon_size = 64;
		number_menu_columns = 6;

		document.getElementById("main_navbar").classList.add("sticky-top");

		const popups = document.getElementsByClassName('popup');
		for (let popup of popups){
			popup.style.maxWidth = '1000px';
		}
	}
    if (width >= 1200){
		number_menu_columns = 8;
	}
	//スクリーンサイズによってページあたりの4コマ表示数を調整
	number_per_page = 4;
    if (width >= 768){
		number_per_page = 3;
	}
    if (width >= 992){
		number_per_page = 4;
	}
    if (width >= 1200){
		number_per_page = 5;
	}
	if (width >= 1400){
		number_per_page = 6;
	}


}
// 【main-script】 スプレッドシート内の記述をjsonデータとして読み込み html 内へ入れ込む
function getJsonp_GAS() {
    $.ajax({
        type: 'GET',
        url: 'https://script.google.com/macros/s/AKfycby9pjvZZlvKwKp23P8DRyzoXKkR4BWVwW9XHIHElP1M7X4NHaHe5bW2kosqZZ92F4_S/exec',
        dataType: 'jsonp',
        jsonpCallback: 'jsondata',
        success: function (json) {
			let count = 1;
            for (let i = 0; i < json.length; i++){
                const story = json[i];
                if (story['タイトル'].length < 1) continue;
                let idol = [];
				//主役アイドルを追加
				const main_idol = story['登場人物1'];
				idol[0] = main_idol;

				//脇役アイドルを追加
                for (let j=1; j<8; j++){
                    const key = '登場人物' + (j+1);
					idol = idol.concat(story[key].split(/\s*[,、]\s*/));//カンマ区切りで複数のアイドルに分割し、名前の前後に入っている空白は削除する
                }
				//ちょい役アイドルを追加
				const referreds = story['言及'].split(/\s*[,、]\s*/);//カンマ区切りで複数のアイドルに分割し、名前の前後に入っている空白は削除する

                //社長、プロデューサー、そらさんを追加
				//いずれ消す
                const staffs = [];
                for (let staff of staffs){
                    if (story[staff] != ''){
                        idol.push(staff);
                    }
                }

				//idとして、Twitter画像の文字列を使用する
				const match = story['img'].match(/media\/([^\?/]+)/);
				let id;
				if (match) {
					id = match[1];
				} else {
					id = story['URL'];
				}

				let new_item = {
					title: story['タイトル'],
					idols: idol,
					referreds: referreds,
					drawers: [story['作画']], //idolsと処理を同じにするために配列として保持。
					series:[story['シリーズ']], //idolsと処理を同じにするために配列として保持。
					url: story['URL'],
					img: story['img'],
					number: count++,
					voice_url: story['アフレコ'],
					keywords: story['キーワード'].split(/[,、]/).map(v => v.trim()), //カンマ区切りで分割し、前後に入っている空白は削除する
					id: id,
				};
				if (new_item.voice_url.length > 0) {
					new_item.series.push('🎤アフレコ');
				}
                data.push(new_item);

            }
			//console.log(json);
            init_menu();
            load_url_params();
			//新しい話を先頭にする(配列を逆順にする)
			data  = data.reverse();
            current_list = data;
            update_list();
			document.getElementById('loading').style.display="none";

        }
    });
}

function get_person_list(key){
    let persons = [];
    for (let i = 0; i< data.length; i++){
        persons = persons.concat(data[i][key]);
    }
    //重複を削除
    let person_list = persons.filter(function (x, i, self) {
        return self.indexOf(x) === i;
    });
    //空白除去
    person_list = person_list.filter(n => n).map((v) => v.trim());

    //ソート
    person_list.sort(function(a,b){
        if( a < b ) return -1;
        if( a > b ) return 1;
        return 0;
    });
    return person_list;
}


function init_idol_menu(num){
	let appended_idol_list = [];
	const all_persons = idol_name_standard_list.concat(get_person_list('idols'));
	//console.log(all_persons);
	let html = '';
	html += ``;
	for (let name of all_persons){
		if (appended_idol_list.indexOf(name) > -1) continue;
		//アイコン画像が登録されたアイドルは画像で表示
		if (idol_icon[name]){
			html += `
			<div class="idol_menu_item">
					<img
						src="icons/${idol_icon[name].id}.jpg"
						alt="${idol_icon[name].name}"
						title="${idol_icon[name].name}"
						style="
							width:${icon_size}px;
							aoutline: 1px solid ${idol_icon[name].color};
							aoutline-offset: -1px;
							border: 1px solid ${idol_icon[name].color};
							border-radius: 40%;"
						onMouseOver="
							//this.style.outlineColor = '${idol_icon[name].color}';
							//this.style.outlineWidth = '6px';
							//this.style.outlineOffset = '-4px';
							//this.style.borderColor = '${idol_icon[name].color}';
							//this.style.borderWidth = '6px';
							//this.style.borderOffset = '-4px';
							this.style.boxShadow = '0 0 3px 4px ${idol_icon[name].color}';
							"
						onMouseOut="
							//this.style.outlineColor='${idol_icon[name].color}';
							//this.style.outlineWidth='1px';
							//this.style.outlineOffset = '-1px';
							this.style.boxShadow = '0 0 0 0px #fff';
							"
						onClick="set_idol${num}('${idol_icon[name].name}');"
					>
			</div>`;
		} else {
			
			//アイコン画像がなかったらボタンテキスト表示→表示しない
			/*
			html += `
			<div  class="idol_menu_item">
				<button type="button" class="btn btn-outline-secondary btn-sm" onClick="set_idol${num}('${name}');">${name}</button>
			</div>`;
			*/
		}

		appended_idol_list.push(name);
	}

	//選択解除ボタン
	html += `
		<div class="idol_menu_item"  style="float:right;">
			<button style="height:${icon_size-20}px; margin-top:20px;" type="button" class="btn btn-warning" onClick="set_idol${num}('');">Clear</button>
		</div>`;
	const menu = document.getElementById(`idol${num}_menu`);
	menu.style.width = `${(icon_size + 4)* number_menu_columns + 2}px`; //メニュー幅を適当に調整した
	menu.innerHTML = html;

}
//アイドル一覧メニューの表示・非表示処理
Array.from(document.getElementsByClassName('dropdown_container')).forEach(function(element){
	function isLefty(elem){
		const rect = elem.getBoundingClientRect();
		const w = window.innerWidth;
		const h = window.innerHeight;
		const left_gap = rect.left;
		const right_gap = w - rect.right;
		return left_gap < right_gap;
	}

	element.addEventListener('mouseover', function(){

		Array.from(this.getElementsByClassName('popup')).forEach(function(popup){
			popup.style.display = 'inline-block';
			if (isLefty(element)){
				popup.classList.add('left0');
				popup.classList.remove('right0');				
			} else {
				popup.classList.remove('left0');
				popup.classList.add('right0');	
			}
		});
	});
	element.addEventListener('mouseout', function(){
		Array.from(this.getElementsByClassName('popup')).forEach(function(popup){
			popup.style.display = 'none';
		});
	});
});

function init_menu(){

	init_idol_menu(1);
	init_idol_menu(2);



    //作画担当フィルターメニュー作成
	drawer_list = get_person_list('drawers');
    let drawers_html = '';
    for (let drawer of drawer_list){
        drawers_html += `<option value="${drawer}">${drawer}</option>`;
    }
    document.getElementById('drawers').innerHTML = '<option value="">作画</option>' + drawers_html;

    //シリーズフィルターメニュー作成
	series_list = get_person_list('series');
    let series_html = '';
    for (let series of series_list){
        series_html += `<option value="${series}">${series}</option>`;
    }
    document.getElementById('series').innerHTML = '<option value="">シリーズ</option>' + series_html;

	//キーワードフィルターメニュー作成
	keywords_list = get_person_list('keywords');
	let keywords_html = '';
	for (let keywords of keywords_list){
		keywords_html += `<option value="${keywords}">${keywords}</option>`;
	}
	document.getElementById('keywords').innerHTML = '<option value="">キーワード</option>' + keywords_html;
}

function load_url_params(){
    const idol1_name = getParam('idol1');
    const idol2_name = getParam('idol2');
	const param_main_only = getParam('main');
	const drawer_name = getParam('drawer');
	const series_name = getParam('series');

    idol1 = idol1_name ? idol1_name : '';
    idol2 = idol2_name ? idol2_name : '';
	const main_only = param_main_only ? param_main_only.toLocaleLowerCase() === 'true' : false;
	drawer = drawer_name ? drawer_name : '';
	series = series_name ? series_name : '';

	set_idol1(idol1);
	set_idol2(idol2);
	set_main_only(main_only);
	set_drawer(drawer);
	set_series(series);
	/*
    document.getElementById('idols1').value = idol1;
    document.getElementById('idols2').value = idol2;
	*/
}

function getParam(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}
function get_menu_idol_label(name){
	if (idol_icon[name]){
		return `<img
			src="icons/${idol_icon[name].id}.jpg"
			alt="${idol_icon[name].name}"
			title="${idol_icon[name].name}"
			style="width:40px;border: medium solid ${idol_icon[name].color};border-radius: 50%;"
		>`;
	}
	return name;

}

function update_url(){
	let params = [];
	params[0] = idol1 ? `idol1=${idol1}`: '';
	params[1] = idol2 ?  `idol2=${idol2}`: '';
	const main_only = document.getElementById('main_only').checked;
	params[2] = main_only ?  `main=${main_only}`: '';
	params[3] = drawer ? `drawer=${drawer}` : '';
	params[4] = series ? `series=${series}` : '';

	const out1 = params.filter(function(value){
		return value;
	}).join('&');
	const out2 = out1 ? `?${out1}` : '';

	//console.log(params, main_only);

	history.replaceState(null, null, '4koma.html' + out2);
}

function reset_parameters(){
	set_idol1("");
	set_idol2("");
	set_main_only(false);
	set_drawer("");
	set_series("");
	set_keywords("");

}

function set_idol1(name){
	document.getElementById('idol1_name').innerHTML = (name != '') ? get_menu_idol_label(name) : 'アイドル1▼';
	idol1 = name;
	viewing_koma = 0;
	update_list();
}
function set_idol2(name){
	document.getElementById('idol2_name').innerHTML = (name != '') ? get_menu_idol_label(name) : 'アイドル2▼';
	idol2 = name;
	viewing_koma = 0;
	update_list();
}
function set_main_only(main_only_param){
	document.getElementById('main_only').checked = main_only_param;
	main_only = main_only_param;
	viewing_koma = 0;
	update_list();
}
function set_drawer(name){
	document.getElementById("drawers").value = name;
	drawer = name;
	viewing_koma = 0;
	update_list();
}
function set_series(name){
	document.getElementById("series").value = name;
	series = name;
	viewing_koma = 0;
	update_list();
}
function set_keywords(name){
	document.getElementById("keywords").value = name;
	keywords = name;
	viewing_koma = 0;
	update_list();
}
/*
document.getElementById('idols1').addEventListener('change', function(){
    idol1 = this.value;
    console.log(idol1);
    viewing_koma = 0;
    update_list();
});
document.getElementById('idols2').addEventListener('change', function(){
    idol2 = this.value;
    console.log(idol2);
    viewing_koma = 0;
    update_list();
});
*/
document.getElementById('drawers').addEventListener('change', function(){
    drawer = this.value;
    console.log(drawer);
    viewing_koma = 0;
	this.blur();//左右矢印でページを移動するが、メニューにフォーカスが残っていると選択項目も変わってしまうため。
    update_list();
});
document.getElementById('series').addEventListener('change', function(){
    series = this.value;
    console.log(series);
    viewing_koma = 0;
	this.blur();//左右矢印でページを移動するが、メニューにフォーカスが残っていると選択項目も変わってしまうため。
    update_list();
});
document.getElementById('keywords').addEventListener('change', function(){
    keywords = this.value;
    console.log(keywords);
    viewing_koma = 0;
	this.blur();//左右矢印でページを移動するが、メニューにフォーカスが残っていると選択項目も変わってしまうため。
    update_list();
});
document.getElementById('main_only').addEventListener('change', function(){
	viewing_koma = 0;
    update_list();
});
document.getElementById('show_whole_picture').addEventListener('change', function(){
    update_list();
});
document.getElementById('fav_only').addEventListener('change', function(){
	viewing_koma = 0;
    update_list();
});
function goPrev(){
	viewing_koma = viewing_koma - number_per_page;
	if (viewing_koma < 0) viewing_koma = 0;
	update_tweets(current_list);
}
function goNext(){
	viewing_koma = viewing_koma + number_per_page;

	//最後尾に移動したときに、画面いっぱいに4コマを表示する
	//if (viewing_koma + number_per_page > current_list.length-1) viewing_koma = current_list.length - number_per_page;
	update_tweets(current_list);
}
document.querySelectorAll('.prev_button').forEach(function(elem){
	elem.addEventListener('click', function(){
		goPrev();
	})
});
document.querySelectorAll('.next_button').forEach(function(elem){
	elem.addEventListener('click', function(){
		goNext();
	})
});

document.querySelectorAll('.first_button').forEach(function(elem){
	elem.addEventListener('click', function(){
		viewing_koma = 0;
		update_tweets(current_list);
	})
});
document.querySelectorAll('.last_button').forEach(function(elem){
	elem.addEventListener('click', function(){
		viewing_koma = current_list.length - number_per_page;
		update_tweets(current_list);
	})
});



//キーボードの矢印でページ移動
document.addEventListener('keyup', function(e){
	//console.log(e);
	switch (e.key){
		case 'ArrowRight':
			goNext();
			break;
		case 'ArrowLeft':
			goPrev();
			break;
	};
});

function update_list(){
    current_list = filter_by_idols();
    update_tweets(current_list);
	
}

function filter_by_idols(){
    let stories = [];
	for (let story of data){
		const all_idols = story.idols.concat(story.referreds);
		//アイドル2が設定されていて、登場リストになかったらスキップ
		if (idol2 != '' && all_idols.indexOf(idol2) < 0 ) continue;

		//作画担当が設定されていて、リストに無かったらスキップ
		if (drawer != '' && story.drawers.indexOf(drawer) < 0 ) continue;

		//シリーズが設定されていて、リストになかったらスキップ
		if (series != '' && story.series.indexOf(series) < 0 ) continue;

		//キーワードが設定されていて、リストになかったらスキップ
		if (keywords != '' && story.keywords.indexOf(keywords) < 0 ) continue;

		//☆がチェックされていて、favsリストになかったらスキップ
		if (document.getElementById('fav_only').checked && !favs.has(story.id)) continue;

		//「主役のみ」がチェックされていたら、アイドル１で主役判定。アイドル２はゲスト回も表示
		if (document.getElementById("main_only").checked){
			if (all_idols.indexOf(idol1) == 0 || idol1 == '') stories.push(story);
		} else {
			if (all_idols.indexOf(idol1) >= 0 || idol1 == '') stories.push(story);
		}
	}

    return stories;
}

function get_participated_idols_text(idols, class_str=""){
	let text = '';
	for (let name of idols){
		if (idol_icon[name]) {
			text += `
					<img
						src="icons/${idol_icon[name].id}.jpg"
						alt="${idol_icon[name].name}"
						style="height:40px;  border: 2px solid ${idol_icon[name].color};border-radius: 20%;"
						class="${class_str}"
					>`;
		} else {
			//text += ' ' + name;
			//標準キャラ以外はリストに入れないことにする
		}
	}
	return text;
}
function starr_click(elem, id){
	if (elem.classList.contains('unstarr')){
		elem.classList.remove('unstarr');
		favs.add(id)
	} else {
		elem.classList.add('unstarr');
		favs.delete(id)
	}
	console.log('favs: ', Array.from(favs.values()))
}

function update_tweets(stories){
    const init = page*number_per_page;

    if (viewing_koma < 1){
        $('#prev_button').prop('disabled', true);
        $('#first_button').prop('disabled', true);
    } else {
        $('#prev_button').prop('disabled', false);
        $('#first_button').prop('disabled', false);
    }
    if (viewing_koma > stories.length-number_per_page-1){
        $('#next_button').prop('disabled', true);
        $('#last_button').prop('disabled', true);
    } else {
        $('#next_button').prop('disabled', false);
        $('#last_button').prop('disabled', false);
    }
    $('.pages').text(`${viewing_koma+1}-${Math.min(viewing_koma+number_per_page, stories.length)}/${stories.length}`);

    let html = '';
    //html += '<div class="container"><div class="row">';
	const show_whole_picture = document.getElementById('show_whole_picture').checked;

    for (var i = viewing_koma; i < viewing_koma + number_per_page; i++) {
        if (i > stories.length -1) break;

		//画像表示部分
		let html_inline_picture = '';
		if (stories[i].img.indexOf('https://pbs.twimg.com/media/') == 0){ //Twitter画像だったらインライン表示
			html_inline_picture = `<p><img alt="${stories[i].title}" src="${stories[i].img}" style="width:100%; ${show_whole_picture ? '' : 'height:300px; object-fit:cover; object-position:0% 0%;'}"></p>`;
		} else {//それ以外だったらそのまま表示
			html_inline_picture = stories[i].img;
		}

		//元画像の権利者表記部分
		let html_quote = '';
		if (stories[i].url.indexOf('https://twitter.com/') == 0 || stories[i].url.indexOf('https://x.com/') == 0){ //TwitterへのリンクだったらTwitterの引用機能を使う
			html_quote = `
				<blockquote class="twitter-tweet">
					<a href="${stories[i].url}">#ミリシタ4コマ 公式ツイート</a>
				</blockquote>`;
		} else { //それ以外はテキストリンク
			html_quote = `<a href="${stories[i].url}">${stories[i].url}</a>`
		}

		const html_inline_voice_link = stories[i].voice_url ? `<a href="${stories[i].voice_url}" target="_blank">🎤</a>` : '';

        html += `
        <div class="story">
			<div style="border:0px solid #92cfbb; box-shadow: 4px 4px 4px gray; border-radius:6px; padding:3px; position:relative;">
				<p
					class="story_title"
					title="タイトル：${stories[i].title}
主演：${stories[i].idols[0]}
共演：${stories[i].idols.slice(1).filter(v => v).join(',')}
ちょい役：${stories[i].referreds.filter(v => v).join(',')}
シリーズ：${stories[i].series[0]}
作画：${stories[i].drawers[0]}"
				>
					${html_inline_voice_link}#${stories[i].number}
					<span style="font-size:1.3em; font-weight: bold;">
						<a target="_blank" href="${stories[i].url}" title="${stories[i].title}">${stories[i].title}</a>
					</span><br>
					<span>${get_participated_idols_text(stories[i].idols)}${get_participated_idols_text(stories[i].referreds, "referred")}</span>
					<span class="${favs.has(stories[i].id) ? '' : 'unstarr'} clickable" style="position:absolute; right: 0px;top:0px;" onclick="starr_click(this, '${stories[i].id}')">⭐</span>
				</p>
				${html_inline_picture}
				${html_quote}
			</div>
        </div>`;

    }
    //html += `</div></div>`;

    document.getElementById('whole').innerHTML = html;
    twttr.widgets.load();

	update_url();
    
}

/*
カプ検索と同じ内容
*/
let idol_name_standard_list = [];// 標準的なアイドル名の並び　[春香, 千早, ...]
let idol_name_dic = {}; //idol_name_dic[天海春香] → 春香
/*
normalize_name(天海春香)→ 春香
*/
function normalize_name(name){
    const nomalized_name = idol_name_dic[name];
    return nomalized_name ? nomalized_name : name;
}

const idol_names = `春香	天海春香		
千早	如月千早		
美希	星井美希		
雪歩	萩原雪歩		
やよい	高槻やよい		
真	菊地真		
伊織	水瀬伊織		
貴音	四条貴音		
律子	秋月律子		
あずさ	三浦あずさ		
亜美	双海亜美		
真美	双海真美		
響	我那覇響		
未来	春日未来		
静香	最上静香		
翼	伊吹翼		
琴葉	田中琴葉		
エレナ	島原エレナ		
美奈子	佐竹美奈子		
恵美	所恵美		
まつり	徳川まつり		
星梨花	箱崎星梨花		
茜	野々原茜		
杏奈	望月杏奈		
ロコ	ロコ	路子	伴田路子
百合子	七尾百合子		
紗代子	高山紗代子		
亜利沙	松田亜利沙		
海美	高坂海美		
育	中谷育		
朋花	天空橋朋花		
エミリー	エミリー	エミリースチュアート	エミリー スチュアート
志保	北沢志保		
歩	舞浜歩		
ひなた	木下ひなた		
可奈	矢吹可奈		
奈緒	横山奈緒		
千鶴	二階堂千鶴		
このみ	馬場このみ		
環	大神環		
風花	豊川風花		
美也	宮尾美也		
のり子	福田のり子		
瑞希	真壁瑞希		
可憐	篠宮可憐		
莉緒	百瀬莉緒		
昴	永吉昴		
麗花	北上麗花		
桃子	周防桃子		
ジュリア	ジュリア		
紬	白石紬		
歌織	桜守歌織		
小鳥	音無小鳥		
美咲	青羽美咲		
そら
社長	高木順二朗	高木社長	
プロデューサー	
`;

let idol_lines = idol_names.split('\n');
for (let idol_line of idol_lines){
	if (idol_line.length < 1) continue;
    let names = idol_line.split('\t');
    names = names.map(function(name){
        return name.trim();
    });
	idol_name_standard_list.push(names[0]);
    for (let i = 0; i < names.length; i++){
        if (idol_name_dic[names[i]]) continue;
        idol_name_dic[names[i]] = names[0];
    }

}

/*
idol_icon = {
	春香: {
		id: haruka,
		color: #e22b30,
	},
}
*/
let idol_icon = {};
{
const idol_icons_data = `haruka	春香	#e22b30
chihaya	千早	#2743d2
miki	美希	#b4e04b
yukiho	雪歩	#d3dde9
yayoi	やよい	#f39939
makoto	真	#515558
iori	伊織	#fd99e1
takane	貴音	#a6126a
ritsuko	律子	#01a860
azusa	あずさ	#9238be
ami	亜美	#ffe43f
mami	真美	#ffe43e
hibiki	響	#01adb9
mirai	未来	#ea5b76
shizuka	静香	#6495cf
tsubasa	翼	#fed552
kotoha	琴葉	#92cfbb
elena	エレナ	#9bce92
minako	美奈子	#58a6dc
megumi	恵美	#454341
matsuri	まつり	#5abfb7
serika	星梨花	#ed90ba
akane	茜	#eb613f
anna	杏奈	#7e6ca8
roco	ロコ	#fff03c
yuriko	百合子	#c7b83c
sayoko	紗代子	#7f6575
arisa	亜利沙	#b54461
umi	海美	#e9739b
iku	育	#f7e78e
tomoka	朋花	#bee3e3
emily	エミリー	#554171
shiho	志保	#afa690
ayumu	歩	#e25a9b
hinata	ひなた	#d1342c
kana	可奈	#f5ad3b
nao	奈緒	#788bc5
chizuru	千鶴	#f19557
konomi	このみ	#f1becb
tamaki	環	#ee762e
fuka	風花	#7278a8
miya	美也	#d7a96b
noriko	のり子	#eceb70
mizuki	瑞希	#99b7dc
karen	可憐	#b63b40
rio	莉緒	#f19591
subaru	昴	#aeb49c
reika	麗花	#6bb6b0
momoko	桃子	#efb864
julia	ジュリア	#d7385f
tsumugi	紬	#ebe1ff
kaori	歌織	#274079
kotori	小鳥	#F7E200
misaki	美咲	#67C0C3
producer	プロデューサー	#000
takagi	社長	#000
sora	そら	#3A547C
sika	詩花	#85AC84
leon	玲音	#5A2B8D
kuroi	黒井社長	#000
`;
	const lines = idol_icons_data.split('\n');
	for (let line of lines){
		if (line.length < 1) continue;
		const items = line.split('\t');
		idol_icon[items[1]] = {
			id: items[0],
			color: items[2],
			name: items[1],
		};
	}
}