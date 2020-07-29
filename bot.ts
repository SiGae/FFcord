import Discord from 'discord.js';
import request from 'request-promise-native';
import config from './config';

const client = new Discord.Client();
const server: {[key: string]: string} = {
  모그리: 'moogle',
  초코보: 'chocobo',
  카벙클: 'carbuncle',
  톤베리: 'tonberry',
};
const job: {[key: string]: string} = {
  Astrologian: '점성술사',
  Bard: '음유시인',
  'Black Mage': '흑마도사',
  'Dark Knight': '암흑기사',
  Dragoon: '용기사',
  Machinist: '기공사',
  Monk: '몽크',
  Ninja: '닌자',
  Paladin: '나이트',
  Scholar: '학자',
  Summoner: '소환사',
  Warrior: '전사',
  'White Mage': '백마도사',
  'Red Mage': '적마도사',
  Samurai: '사무라이',
  Dancer: '무도가',
  Gunbreaker: '건브레이커',
};
interface outputLayout {
  encounterID: number;
  spec: string;
  percentile: number;
}

const percentileSortFn = (a: outputLayout, b: outputLayout) =>
  b.percentile - a.percentile;

const sortByPercentile = (rawData: outputLayout[][]) =>
  rawData.map((item) => {
    item.sort(percentileSortFn);
    return item;
  });

function SlicingByLayer(rawData: Array<any>): Array<Array<outputLayout>> {
  const layer: Array<outputLayout> = [];
  const encounterIDList: Array<number> = [];
  const output: Array<Array<outputLayout>> = [];
  let cnt: number = -1;
  rawData.forEach((i) => {
    if (i.difficulty === 101 || i.encounterID === 1050) {
      layer.push({
        encounterID: i.encounterID,
        spec: i.spec,
        percentile: i.percentile,
      });
    }
  });

  layer.forEach((e) => {
    if (!encounterIDList.find((val) => val === e.encounterID)) {
      output.push([]);
      encounterIDList.push(e.encounterID);
      cnt += 1;
    }
    output[cnt].push(e);
  });
  return output;
}

function SlicedBySpec(rawData: Array<Array<outputLayout>>) {
  let specList: Array<string> = [];
  const output: Array<Array<outputLayout>> = [];
  const sortData: outputLayout[][] = sortByPercentile(rawData);

  sortData.forEach((data) => {
    specList = [];
    output.push([]);
    for (let i: number = 0; i < data.length; i += 1) {
      if (!specList.find((val) => val === data[i].spec)) {
        specList.push(data[i].spec);
        output[output.length - 1].push(data[i]);
      }
    }
  });

  return output;
}

async function querTest(
  serverNameENG: string,
  charNameENG: string,
  flag: number
) {
  const url = `https://www.fflogs.com:443/v1/parses/character/${encodeURI(
    charNameENG
  )}/${serverNameENG}/KR`;
  const query = {
    uri: url,
    qs: {
      api_key: config.FF_KEY,
      metric: 'rdps',
      zone: flag,
      timeframe: 'historical',
    },
  };
  return JSON.parse(await request(query));
}

async function RankMarker(serverName: string, charName: string, flag: number) {
  const parseTier: Array<string> = [
    '(회딱)',
    '(초딱)',
    '(파딱)',
    '(보딱)',
    '(주딱)',
    '(핑딱)',
    '(노딱)',
  ];
  const encounter: {[key: number]: string} = {
    65: 'Eden Prime',
    66: 'Voidwalker',
    67: 'Leviathan',
    68: 'Titan',
    1050: 'The Epic of Alexander',
  };

  let output: string = '';
  if (Object.keys(server).find((e) => e === serverName)) {
    const getData: outputLayout[][] = SlicedBySpec(
      SlicingByLayer(await querTest(server[serverName], charName, flag))
    );

    getData.forEach((e) => {
      output += `> **${encounter[e[0].encounterID]}** \n`;
      e.forEach((d) => {
        if (d.percentile < 25) {
          output += `> \t\`${job[d.spec]} : ${
            Math.floor(d.percentile * 100) / 100
          }${parseTier[0]}\`\n`;
        } else if (d.percentile < 50) {
          output += `> \t\`${job[d.spec]} : ${
            Math.floor(d.percentile * 100) / 100
          }${parseTier[1]}\`\n`;
        } else if (d.percentile < 75) {
          output += `> \t\`${job[d.spec]} : ${
            Math.floor(d.percentile * 100) / 100
          }${parseTier[2]}\`\n`;
        } else if (d.percentile < 95) {
          output += `> \t\`${job[d.spec]} : ${
            Math.floor(d.percentile * 100) / 100
          }${parseTier[3]}\`\n`;
        } else if (d.percentile < 99) {
          output += `> \t\`${job[d.spec]} : ${
            Math.floor(d.percentile * 100) / 100
          }${parseTier[4]}\`\n`;
        } else if (d.percentile < 100) {
          output += `> \t\`${job[d.spec]} : ${
            Math.floor(d.percentile * 100) / 100
          }${parseTier[5]}\`\n`;
        } else {
          output += `> \t\`${job[d.spec]} : ${
            Math.floor(d.percentile * 100) / 100
          }${parseTier[6]}\`\n`;
        }
      });
    });
  } else {
    output = 'ERR : 서버명에 문제가 있습니다.';
  }
  return output;
}

async function ParseUltimateAlexander(serverName: string, charName: string) {
  const output: string = `\`'${charName}'\`의 \`'절 알렉산더'\` 기록\n`;

  return output + (await RankMarker(serverName, charName, 32));
}

async function ParseEdenGate(serverName: string, charName: string) {
  const output: string = `\`'${charName}'\`의 \`'Eden's Gate'\` 기록\n`;
  return output + (await RankMarker(serverName, charName, 29));
}

client.on('message', async (message) => {
  console.log(message.content);
  const msg: string[] = message.content.split(' ');
  console.log(msg[0]);
  if (msg[0] === '/ffeg') {
    message.channel.send(await ParseEdenGate(msg[1], msg[2]));
  } else if (msg[0] === '/ffua') {
    message.channel.send(await ParseUltimateAlexander(msg[1], msg[2]));
  } else if (msg[0] === '/ff') {
    message.channel.send(await ParseEdenGate(msg[1], msg[2]));
    message.channel.send(await ParseUltimateAlexander(msg[1], msg[2]));
  }
});

client.login(config.DISCORD_KEY);
