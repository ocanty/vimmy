
namespace Vimmy
{
	export namespace Assembler
	{
		// deepmerge by Zachary Murray (dremelofdeath) CC-BY-SA 3.0,
		// TODO: rewrite to tell CC-BY-SA to fuck off
		function deepmerge(foo: Object, bar: Object)
		{
			var merged = {};
			for (var each in bar)
			{
				if (foo.hasOwnProperty(each) && bar.hasOwnProperty(each))
				{
					if (typeof (foo[each]) == "object" && typeof (bar[each]) == "object")
					{
						merged[each] = deepmerge(foo[each], bar[each]);
					} else
					{
						merged[each] = [foo[each], bar[each]];
					}
				}
				else if (bar.hasOwnProperty(each))
				{
					merged[each] = bar[each];
				}
			}

			for (var each in foo)
			{
				if (!(each in bar) && foo.hasOwnProperty(each))
				{
					merged[each] = foo[each];
				}
			}

			return merged;
		}

		/**
		* A TokenSpec is a ruleset taken by a Tokenizer to determine what it considers as tokens
		*/
		export class TokenTree
		{
			constructor()
			{
				this.tree = new Object;
			}

			private tree: Object

			/**
			* Adds a keyword rule to the token specification
			* @param keyword Keyword that triggers the token to be found, eg: "mov "
			* @param token Token to be returned when the keyword is found, eg: "INSTRUCTION"
			*/
			addKeyword(keyword: string, token: string) 
			{
				// the root branch
				var obj = {}

				// current branch
				var ref = obj
				for (let i = 1; i < keyword.length; i++)
				{
					var s = keyword.charAt(i)

					// add a new branch with this character
					ref[s] = {}

					// set pointer to the new branch
					ref = ref[s]
				}

				// set the deepest point to our token
				ref[".head"] = token

				// Add an object to the base of the tree if it doesnt exist
				if (!this.tree.hasOwnProperty(keyword.charAt(0))) { this.tree[keyword.charAt(0)] = {} }

				this.tree[keyword.charAt(0)] = deepmerge(obj, this.tree[keyword.charAt(0)])

			}

			/**
			 * Returns the TokenSpec tree, to be used by a tokenizer
			 */
			getTree(): Object { return this.tree }
		}
	}
}