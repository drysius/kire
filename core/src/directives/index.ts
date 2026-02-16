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

        kire.varThen('NullProtoObj', (api) => {
            api.prologue(`const NullProtoObj = this.NullProtoObj;`);
        });

        kire.varThen('index', (api) => {
            // This is tricky as it depends on loop. 
            // If I just register it, the compiler will call it if 'index' is found.
            // But the injection point matters.
        });

		defineDirectives(kire);
		nativeDirectives(kire);
		importDirectives(kire);
		componentDirectives(kire);
        
        nativeElements(kire);
	},
};
