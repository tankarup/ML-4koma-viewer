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

// ページ読み込み後の処理
window.onload = function () {
    // 【main-script】 を実行
    getJsonp_GAS();

    if (screen.width > 700) number_per_page = 6;
    //PCの場合は表示数を10に増やす
    if (screen.width > 1000) number_per_page = 12;


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

function get_idol_list(){
	let idol_names_from_data = get_person_list('idols');
	let idol_list = idol_name_standard_list;

	for (let name of idol_names_from_data){
		if (idol_list.indexOf(name) == -1) idol_list.push(name);
	}
	return idol_list;
}

function init_menu(){

    idol_list = get_idol_list();
    drawer_list = get_person_list('drawers');

    //アイドルフィルターメニュー作成
    let options_html = '';
    for (let idol of idol_list){
        options_html += `<option value="${idol}">${idol}</option>`;
    }

    document.getElementById('idols1').innerHTML = '<option value="">登場人物1</option>' + options_html;
    document.getElementById('idols2').innerHTML = '<option value="">登場人物2</option>' + options_html;

    //作画担当フィルターメニュー作成
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

    document.getElementById('idols1').value = idol1;
    document.getElementById('idols2').value = idol2;
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
劇子	劇場の魂		
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
