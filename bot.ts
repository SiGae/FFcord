import Discord from 'discord.js'
import request from "request-promise-native";
import config from './config'

const client = new Discord.Client()



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

const server:{[key:string]: string} = {
	'모그리' : 'moogle',
	'초코보' : 'chocobo',
	'카벙클' : 'carbuncle',
	'톤베리' : 'tonberry'
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

function SortByPercentile(rawData: Array<any>) {
	let output:Array<outputLayout> = []
	for(const e of rawData) {
		console.log(e.spec)
	}
}

function SlicedBySpec(rawData: Array<Array<outputLayout>>) {
	let specList:Array<string> = []
	let output:Array<any> = []
	
	for( const data of rawData){
		specList = []
		for(const e of data) {
			if (!(specList.find(val => val === e.spec))) {
				specList.push(e.spec)
				output.push(e)
			}
		}
	}
	return output
}


async function ParseEdenGate(serverName : string, charName : string) {
	let getData : Array<outputLayout>
	let output : string = ""	
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
			let chec = JSON.parse((await request(query)))
			return chec
	}
	
	getData = SlicedBySpec(SlicingByLayer(await querTest(serverName, charName)))
	console.log(getData)

	return output

	

}

client.on('message', (message)=> {
	console.log(message.content)
	let msg: string[] = message.content.split(" ")
	 console.log(msg[0])
	if (msg[0] == ";ffeg") {
		let output = ParseEdenGate(server[msg[1]], msg[2])
	}
})

client.login(config.DISCORD_KEY)