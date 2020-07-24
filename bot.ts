import Discord from 'discord.js'
import request from "request-promise-native";
import config from './config'

const client = new Discord.Client()
const server:{[key:string]: string} = {
	'모그리' : 'moogle',
	'초코보' : 'chocobo',
	'카벙클' : 'carbuncle',
	'톤베리' : 'tonberry'
}
const job:{[key:string]: string} = {
	"Astrologian" : "점성술사",
	"Bard" : "음유시인",
	"Black Mage" : "흑마도사",
	"Dark Knight" : "암흑기사",
	"Dragoon" : "용기사",
	"Machinist" : "기공사",
	"Monk" : "몽크",
	"Ninja" : "닌자",
	"Paladin" : "나이트",
	"Scholar" : "학자",
	"Summoner" : "소환사",
	"Warrior" : "전사",
	"White Mage" : "백마도사",
	"Red Mage" : "적마도사",
	"Samurai" : "사무라이",
	"Dancer" : "무도가",
	"Gunbreaker" : "건브레이커"
}
interface outputLayout {
	encounterID:number;
	spec:string;
	percentile:number;

}

function SlicingByLayer(rawData: Array<any>):Array<Array<outputLayout>> {
	let layer:Array<outputLayout> = []
	let encounterIDList: Array<number> = []
	let output: Array<Array<outputLayout>> = []
	let cnt:number = -1
	for (const e of rawData) {
		if (e.difficulty === 101 || e.encounterID === 1050 )
			layer.push({
				encounterID : e.encounterID,
                spec : e.spec,
                percentile : e.percentile
			})
	}

	for (const e of layer) {
		if (!(encounterIDList.find(val => val === e.encounterID))) {
			output.push([])
			encounterIDList.push(e.encounterID)
			cnt += 1
		}
		output[cnt].push(e)
	}
	return output
}

function SlicedBySpec(rawData: Array<Array<outputLayout>>) {
	let specList:Array<string> = []
	let output:Array<Array<outputLayout>> = []
	
	for( const data of rawData){
		specList = []
		output.push([])
		for (let i: number = 0 ; i < data.length ; i += 1) {
			if (!(specList.find(val => val === data[i].spec))) {
				specList.push(data[i].spec)
				output[output.length - 1].push(data[i])
			}
		}
	}
	return output
}

async function ParseUltimateAlexander(serverName : string, charName : string) {

}

async function ParseEdenGate(serverName : string, charName : string) {

	const encounter :{[key:number]: string} = {
		65 : "Eden Prime",
		66 : "Voidwalker",
		67 : "Leviathan",
		68 : "Titan"
	}
	const parseTier:Array<string> = ['(회딱)', '(초딱)', '(파딱)', '(보딱)', '(주딱)', '(핑딱)', '(노딱)']
	let getData : Array<Array<outputLayout>>
	let output : string = `\`${charName}\`의 Eden's Gate 기록\n`
	let flag : boolean = false

	async function querTest(serverName : string, charName : string) {
		const url = `https://www.fflogs.com:443/v1/parses/character/${encodeURI(charName)}/${serverName}/KR`
		const query = {
			uri: url,
			qs : {
				'api_key' : config.FF_KEY,
				'metric' : "rdps",
				'zone' : 29,
				'timeframe' : 'historical'
			}
		}
		return JSON.parse((await request(query)))
	}


	if (Object.keys(server).find(e => e === serverName)){
		serverName = server[serverName]
		getData = SlicedBySpec(SlicingByLayer(await querTest(serverName, charName)))
		for (const e of getData) {
			output += ("> **"+encounter[e[0].encounterID] + "** \n")
			for (const d of e) {
				let tier: string = ""
				if (d.percentile < 25)
					tier = parseTier[0];
				else if (d.percentile < 50)
					tier = parseTier[1]
				else if (d.percentile < 75)
					tier =  parseTier[2]
				else if (d.percentile < 95)
					tier =  parseTier[3]
				else if (d.percentile < 99)
					tier =  parseTier[4]
				else if (d.percentile < 100)
					tier =  parseTier[5]
				else 
					tier =  parseTier[6]
				output += ("> \t" + job[d.spec] + " : \`" + (Math.floor(d.percentile * 100)/100) + tier + "\`\n")
			}
		}
	} else {
		output = "ERR : 서버명에 문제가 있습니다."
	}
	console.log(output)
	return output

}

client.on('message', async (message)=> {
	console.log(message.content)
	let msg: string[] = message.content.split(" ")
	 console.log(msg[0])
	if (msg[0] == "/ffeg") {
		message.channel.send(await ParseEdenGate(msg[1], msg[2]))
	}
})

client.login(config.DISCORD_KEY)