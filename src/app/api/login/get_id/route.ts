import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import cheerio from "cheerio";

export async function POST(req: NextRequest, res: NextResponse) {
	try {
		const startTime = new Date();

		const loginPage = await fetch("https://aspen.cpsd.us/aspen/logon.do");

		const loginText = await loginPage.text();
		const $ = cheerio.load(loginText);
		const apacheInput = $("input");
		const apacheToken = apacheInput.attr("value");

		const loginCookies = loginPage.headers.get("set-cookie");
		const sessionId = loginCookies?.split(";")[0].split("=")[1];

		const endTime = new Date();
		const time = endTime.getTime() - startTime.getTime();
		console.log(`\x1b[32m ✓\x1b[0m Got Session ID and Apache Token in`, time, `ms`);

		return NextResponse.json({ sessionId, apacheToken }, { status: 200 })
	} catch (error) {
		console.error("Error during scraping:", error);
		if (res.status) {
			return NextResponse.json(
				{ error: "Internal Server Error" },
				{ status: 500 },
			);
		} else {
			console.error("res object does not have a status function");
		}

		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}