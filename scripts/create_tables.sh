mysql -e "
create database if not exists owrank character set utf8;
use owrank;
create table if not exists battle_cookie(battletag varchar(40) not null, cookie varchar(120) not null, primary key (battletag)) DEFAULT CHARSET=utf8;
create table if not exists profile(battletag varchar(40) not null, season tinyint unsigned not null, hero char(16) not null, date date not null, json varchar(20000) not null, primary key (battletag, season, hero, date), key (date)) DEFAULT CHARSET=utf8;
create table if not exists player_rank(battletag varchar(40) not null, season tinyint unsigned not null, date date not null, rank smallint unsigned not null, highest_rank smallint unsigned not null, primary key (battletag, season, date)) DEFAULT CHARSET=utf8;
create table if not exists player_endor(battletag varchar(40) not null, date date not null, player_level int unsigned not null, level tinyint unsigned not null, teammate int unsigned not null, sportsmanship int unsigned not null, shotcaller int unsigned not null, primary key (battletag, date)) DEFAULT CHARSET=utf8;
create table if not exists gamedata(name varchar(255) not null, value varchar(10000) not null, primary key (name)) DEFAULT CHARSET=utf8;
create table if not exists gametime(season smallint not null, rank smallint not null, hero char(16) not null, date date not null, gametime double not null, wintime double not null, primary key (season, rank, hero, date)) DEFAULT CHARSET=utf8;
quit"
