import nativeElements from "../elements/natives";
import registerTypes from "../type-declare";
import type { KirePlugin } from "../types";
import componentDirectives from "./component";
import importDirectives from "./import";
import defineDirectives from "./layout";
import nativeDirectives from "./natives";
import propsDirectives from "./props";

export const KireDirectives: KirePlugin = {
	name: "@kirejs/core",
	sort: 100,
	load(kire) {
		registerTypes(kire);

		defineDirectives(kire);
		nativeDirectives(kire);
		importDirectives(kire);
		componentDirectives(kire);
		propsDirectives(kire);

		nativeElements(kire);
	},
};
