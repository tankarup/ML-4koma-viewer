//https://www.koreyome.com/make-spreadsheet-to-json-at-google-apps-script/

let data = []; //全データ
let current_list = []; //現在表示中のデータ
let idol_list = [];
let drawer_list = [];
let idol1 = '';
let idol2 = '';
let drawer = '';
let page = 0;
let viewing_koma = 0;
let number_per_page = 4;
let number_menu_columns = 4;
let icon_size = 32;

// ページ読み込み後の処理
window.onload = function () {
    // 【main-script】 を実行
    getJsonp_GAS();

    if (screen.width > 700){
		icon_size = 64;
		number_per_page = 6;
		number_menu_columns = 6;

		document.getElementById("main_navbar").classList.add("sticky-top")
	}
    //PCの場合は表示数を10に増やす
    if (screen.width > 1000){
		number_per_page = 12;
		number_menu_columns = 8;
	}


}
// 【main-script】 スプレッドシート内の記述をjsonデータとして読み込み html 内へ入れ込む
function getJsonp_GAS() {
    $.ajax({
        type: 'GET',
        url: 'https://script.google.com/macros/s/AKfycbxpOMNXs_wQA0H-i2Y3KXlTOa-fMKz6ltr1eUwMCD8LQJ94QDsg8GEY/exec',
        dataType: 'jsonp',
        jsonpCallback: 'jsondata',
        success: function (json) {
            for (let i = 0; i < json.length; i++){
                const story = json[i];
                if (story['タイトル'].length < 1) continue;
                let idol = [];
                //アイドルを追加
                for (let j=0; j<7; j++){
                    const key = '登場人物' + (j+1);
                    if (story[key].length < 1) continue;
                    idol.push(story[key]);
                }
                //社長、プロデューサー、そらさんを追加
                const staffs = ['社長', 'プロデューサー', 'そら'];
                for (let staff of staffs){
                    if (story[staff] != ''){
                        idol.push(staff);
                    }
                }
                data.push(
                    {
                        title: story['タイトル'],
                        idols: idol,
                        drawers: [story['作画']], //idolsと処理を同じにするために配列として保持。
                        url: story['URL'],
                    }
                );
            }
            init_menu();
            load_url_params();
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
    person_list = person_list.filter(n => n);

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
	let html = '';
	html += `<ul class="dropdown_nav" style="column-count: ${number_menu_columns};column-gap: 5px;">`;
	const lines = idol_icons.split('\n');
	for (let line of lines){
		if (line.length < 1) continue;
		const items = line.split('\t');
		html += `
			<li style="margin-bottom: 5px;">

					<img
						src="icons/${items[0]}.jpg"
						alt="${items[1]}"
						title="${items[1]}"
						style="width:${icon_size}px;border: medium solid #fff;"
						onMouseOver="this.style.borderColor='${items[2]}'"
						onMouseOut="this.style.borderColor='#fff'"
						onClick="set_idol${num}('${items[1]}');"
					>

			</li>`;
		appended_idol_list.push(items[1]);
	}
	//アイコンがないメンバーを追加
	const idol_names_from_data = get_person_list('idols');
	for (let name of idol_names_from_data){
		if (appended_idol_list.indexOf(name) == -1){
			html += `
			<li style="margin-bottom: 5px;">
				<button type="button" class="btn btn-outline-secondary btn-sm" onClick="set_idol${num}('${name}');">${name}</button>
			</li>`;
		}
	}
	//選択解除ボタン
	html += `
		<li>
			<button type="button" class="btn btn-warning" onClick="set_idol${num}('');">Clear</button>
		</li>`;
	document.getElementById(`idol${num}_menu`).innerHTML = html;

}

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

}

function load_url_params(){
    const idol1_name = getParam('idol1');
    const idol2_name = getParam('idol2');

    idol1 = idol1_name ? idol1_name : '';
    idol2 = idol2_name ? idol2_name : '';
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
function set_idol1(name){
	document.getElementById('idol1_name').innerText = (name != '') ? name : 'アイドル1▼';
	idol1 = name;
	viewing_koma = 0;
	update_list();
}
function set_idol2(name){
	document.getElementById('idol2_name').innerText = (name != '') ? name : 'アイドル2▼';
	idol2 = name;
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
    update_list();
});

document.getElementById('prev_button').addEventListener('click', function(){

    viewing_koma = viewing_koma - number_per_page;
    if (viewing_koma < 0) viewing_koma = 0;
    update_tweets(current_list);
});
document.getElementById('next_button').addEventListener('click', function(){
    viewing_koma = viewing_koma + number_per_page;
    if (viewing_koma + number_per_page > current_list.length-1) viewing_koma = current_list.length - number_per_page;
    update_tweets(current_list);
});
document.getElementById('first_button').addEventListener('click', function(){

    viewing_koma = 0;
    update_tweets(current_list);
});
document.getElementById('last_button').addEventListener('click', function(){

    viewing_koma = current_list.length - number_per_page;
    update_tweets(current_list);
});

document.getElementById('leading_actor').addEventListener('change', function(){

    update_list();
});

function update_list(){
    current_list = filter_by_idols();
    update_tweets(current_list);
}

function filter_by_idols(){
    let stories = [];
    if (document.getElementById("leading_actor").checked){
        for (let story of data){
            if ((story.idols.indexOf(idol1) == 0 || idol1 == '') && (story.idols.indexOf(idol2) == 0 || idol2 == '') && (story.drawers.indexOf(drawer) >= 0 || drawer == '')){
                stories.push(story);
            }
        }
    } else {
        for (let story of data){
            if ((story.idols.indexOf(idol1) >= 0 || idol1 == '') && (story.idols.indexOf(idol2) >= 0 || idol2 == '') && (story.drawers.indexOf(drawer) >= 0 || drawer == '')){
                stories.push(story);
            }
        }
    }



    return stories;
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
    $('#pages').text(`${viewing_koma+1}-${Math.min(viewing_koma+number_per_page, stories.length)}/${stories.length}`);

    let html = '';
    //html += '<div class="container"><div class="row">';

    for (var i = viewing_koma; i < viewing_koma + number_per_page; i++) {
        if (i > stories.length -1) break;
        html += `
        <div class="story -col-xl-3 -col-md-4 -col-sm-12 ">
            <p><a target="_blank" href="${stories[i].url}"><span style="font-size:1.3em; font-weight: bold;">${stories[i].title}</span> <img src="open.png" style="width:1em; height:1em;"></a><br>${stories[i].idols.join(', ')}</p>
            <blockquote class="twitter-tweet">
                <a href="${stories[i].url}">#ミリシタ4コマ 公式ツイート</a>
            </blockquote>
        </div>`;

    }
    //html += `</div></div>`;

    document.getElementById('whole').innerHTML = html;
    twttr.widgets.load();
    
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
社長	高木順二朗	高木社長	
げき子	劇場の魂	劇子	
黒井社長	黒井崇男		
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


const idol_icons = `haruka	春香	#e22b30
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

`;
