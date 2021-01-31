//https://www.koreyome.com/make-spreadsheet-to-json-at-google-apps-script/

let data = [];
let idol_list = [];
let drawer_list = [];
let idol1 = '';
let idol2 = '';
let drawer = '';
let page = 0;
let number_per_page = 5;

// ページ読み込み後の処理
window.onload = function () {
    // 【main-script】 を実行
    getJsonp_GAS();
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
            update_tweets(data);

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



document.getElementById('idols1').addEventListener('change', function(){
    idol1 = this.value;
    console.log(idol1);
    page = 0;
    filter_by_idols();
});
document.getElementById('idols2').addEventListener('change', function(){
    idol2 = this.value;
    console.log(idol2);
    page = 0;
    filter_by_idols();
});
document.getElementById('drawers').addEventListener('change', function(){
    drawer = this.value;
    console.log(drawer);
    page = 0;
    filter_by_idols();
});

document.getElementById('prev_button').addEventListener('click', function(){

    page = page - 1;
    const filtered = filter_by_idols();
});
document.getElementById('next_button').addEventListener('click', function(){

    page = page + 1;
    const filtered = filter_by_idols();
});

function filter_by_idols(){
    let stories = [];
    for (let story of data){
        if ((story.idols.indexOf(idol1) >= 0 || idol1 == '') && (story.idols.indexOf(idol2) >= 0 || idol2 == '') && (story.drawers.indexOf(drawer) >= 0 || drawer == '')){
            stories.push(story);
        }
    }
    update_tweets(stories);

    return stories;
}

function update_tweets(stories){
    const init = page*number_per_page;

    if (page < 1){
        $('#prev_button').prop('disabled', true);
    } else {
        $('#prev_button').prop('disabled', false);
    }
    if ((page+1)*number_per_page > stories.length-1){
        $('#next_button').prop('disabled', true);
    } else {
        $('#next_button').prop('disabled', false);
    }
    $('#pages').text(`${init+1}-${Math.min(init+number_per_page, stories.length)}/${stories.length}`);

    let html = '';
    //html += '<div class="container"><div class="row">';

    for (var i = init; i < init + number_per_page; i++) {
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

