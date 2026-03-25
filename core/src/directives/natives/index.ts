import type { Kire } from "../../kire";
import attrDirectives from "./attributes";
import checkDirectives from "./checks";
import ifDirectives from "./if";
import loopDirectives from "./loop";
import miscDirectives from "./misc";
import switchDirectives from "./switch";

export default (kire: Kire) => {
	kire.kireSchema({
		name: "kire-core",
		description:
			"Built-in directives and control-flow primitives shipped with the Kire runtime.",
		author: "Drysius",
		repository: "https://github.com/drysius/kire",
		version: "0.1.2",
	});

	ifDirectives(kire);
	loopDirectives(kire);
	checkDirectives(kire);
	attrDirectives(kire);
	switchDirectives(kire);
	miscDirectives(kire);
};
