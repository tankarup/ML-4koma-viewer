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

function init_menu(){

    idol_list = get_person_list('idols');
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

