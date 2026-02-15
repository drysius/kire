import type { KirePlugin } from "../types";
import registerTypes from "../type-declare";
import componentDirectives from "./component";
import importDirectives from "./import";
import defineDirectives from "./layout";
import nativeDirectives from "./natives";
import nativeElements from "../elements/natives";

export const KireDirectives: KirePlugin = {
	name: "@kirejs/core",
	sort: 100,
	load(kire) {
        registerTypes(kire);

		defineDirectives(kire);
		nativeDirectives(kire);
		importDirectives(kire);
		componentDirectives(kire);
        
        nativeElements(kire);
	},
};
