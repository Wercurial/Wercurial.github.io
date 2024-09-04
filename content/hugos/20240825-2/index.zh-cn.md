---
title: "hugo博客-blowfish主题添加音乐组件"
date: 2024-08-25
description: "添加音乐组件，并在切换页面时保持音乐播放。"
tags: ["hugo", "blowfish", "music"]
type: 'blog'
---

添加音乐组件，并在切换页面时保持音乐播放。

<!--more-->

# 1. 添加音乐组件
## 1.1 创建music.html文件
- 在layouts/partials目录下创建music.html文件，添加音乐对应参数说明
    - name: 音乐名， #'探故知'
    - url: 音乐外链地址，#'http://music.163.com/song/media/outer/url?id=2613724903.mp3'
    - artist: 音乐家，#'吉泽树'
    - cover: 音乐封面，#'https://s1.best-wallpaper.net/wallpaper/m/1207/Kitten-greeting_m.webp'
```html
<!DOCTYPE html>
<html>

<head>
    <!-- require APlayer -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/aplayer/dist/APlayer.min.css">
    <script src="https://cdn.jsdelivr.net/npm/aplayer/dist/APlayer.min.js"></script>
    <!-- require MetingJS -->
    <script src="https://cdn.jsdelivr.net/npm/meting@2.0.1/dist/Meting.min.js"></script>
</head>

<body>
    <div class="demo">
        <div id="player1">
        </div>
    </div>
    <script>
        var ap = new APlayer
            ({
                element: document.getElementById('player1'),
                fixed: true,
                showlrc: false,
                autoplay: false,
                mini: true,
                theme: '#f8f4fc',
                loop: 'all',
                order: 'random',
                preload: 'auto',
                volume: 0.4,
                mutex: true,
                listFolded: true,
                listMaxHeight: '500px',
                lrcType: 0,
                music: [
                    {
                        name: '探故知', url: 'http://music.163.com/song/media/outer/url?id=2613724903.mp3', artist: '吉泽树', cover: 'https://s1.best-wallpaper.net/wallpaper/m/1207/Kitten-greeting_m.webp'
                    },
                    {
                        name: '如果当时2020', url: 'http://music.163.com/song/media/outer/url?id=1488737309.mp3', artist: '许嵩,朱婷婷', cover: 'https://s1.best-wallpaper.net/wallpaper/m/1207/Kitten-greeting_m.webp'
                    },
                    {
                        name: '如果云知道', url: 'http://music.163.com/song/media/outer/url?id=2109099118.mp3', artist: '许茹芸', cover: 'https://s1.best-wallpaper.net/wallpaper/m/1207/Kitten-greeting_m.webp'
                    },
                    {
                        name: '一生有你', url: 'http://music.163.com/song/media/outer/url?id=2017129217.mp3', artist: '水木年华', cover: 'https://s1.best-wallpaper.net/wallpaper/m/1207/Kitten-greeting_m.webp'
                    },
                    {
                        name: '觉悟', url: 'http://music.163.com/song/media/outer/url?id=2030542462.mp3', artist: '王小帅', cover: 'https://s1.best-wallpaper.net/wallpaper/m/1207/Kitten-greeting_m.webp'
                    },
                ]
            });
        //ap.init();
    </script>
</body>

```


# 2. 配置音乐组件在切换页面后仍保持播放
```html
<!DOCTYPE html>
<html>

<head>
    <!-- require APlayer -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/aplayer/dist/APlayer.min.css">
    <script src="https://cdn.jsdelivr.net/npm/aplayer/dist/APlayer.min.js"></script>
    <!-- require MetingJS -->
    <script src="https://cdn.jsdelivr.net/npm/meting@2.0.1/dist/Meting.min.js"></script>
</head>

<body>
    <div class="demo">
        <div id="player1">
        </div>
    </div>
    <script>
        var ap = new APlayer
            ({
                element: document.getElementById('player1'),
                fixed: true,
                showlrc: false,
                autoplay: false,
                mini: true,
                theme: '#f8f4fc',
                loop: 'all',
                order: 'random',
                preload: 'auto',
                volume: 0.4,
                mutex: true,
                listFolded: true,
                listMaxHeight: '500px',
                lrcType: 0,
                music: [
                    {
                        name: '探故知', url: 'http://music.163.com/song/media/outer/url?id=2613724903.mp3', artist: '吉泽树', cover: 'https://s1.best-wallpaper.net/wallpaper/m/1207/Kitten-greeting_m.webp'
                    },
                    {
                        name: '如果当时2020', url: 'http://music.163.com/song/media/outer/url?id=1488737309.mp3', artist: '许嵩,朱婷婷', cover: 'https://s1.best-wallpaper.net/wallpaper/m/1207/Kitten-greeting_m.webp'
                    },
                    {
                        name: '如果云知道', url: 'http://music.163.com/song/media/outer/url?id=2109099118.mp3', artist: '许茹芸', cover: 'https://s1.best-wallpaper.net/wallpaper/m/1207/Kitten-greeting_m.webp'
                    },
                    {
                        name: '一生有你', url: 'http://music.163.com/song/media/outer/url?id=2017129217.mp3', artist: '水木年华', cover: 'https://s1.best-wallpaper.net/wallpaper/m/1207/Kitten-greeting_m.webp'
                    },
                    {
                        name: '觉悟', url: 'http://music.163.com/song/media/outer/url?id=2030542462.mp3', artist: '王小帅', cover: 'https://s1.best-wallpaper.net/wallpaper/m/1207/Kitten-greeting_m.webp'
                    },
                ]
            });
        //ap.init();
        isRecover = false;
    function ready(){
        ap.on('canplay', function () {
            if(!isRecover){
                if(localStorage.getItem("musicIndex") != null){
                    musicIndex = localStorage.getItem("musicIndex");
                    musicTime = localStorage.getItem("musicTime");
                    if(ap.list.index != musicIndex){
                        ap.list.switch(musicIndex);
                    }else{
                        ap.seek(musicTime);
                        ap.play();
                        localStorage.clear();
                        isRecover = true;
                    }
                }else{
                    isRecover = true;
                }
            }
        });
    }

    window.onbeforeunload = function(event) {
        if(!ap.audio.paused){
            musicIndex = ap.list.index;
            musicTime = ap.audio.currentTime;
            localStorage.setItem("musicIndex",musicIndex);
            localStorage.setItem("musicTime",musicTime);
        }
    };
    </script>
</body>

```