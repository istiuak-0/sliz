export function parseFlags<const T extends readonly string[]>(
   args: readonly string[],
   required: T
) {
   const requiredSet = new Set(required)
   const flags = {} as { [Key in T[number]]: string }

   for (let i = 0; i < args.length; i++) {
      const arg = args[i]

      if (!arg.startsWith('--')) {
         continue
      }

      const key = arg.slice(2) as T[number]
      if (!requiredSet.has(key)) {
         continue
      }

      const value = args[++i]

      if (!value || value.startsWith('-')) {
         throw new Error(`Missing value for --${key}`)
      }


      flags[key] = value
   }


   for (const key of required) {
      if (!(key in flags)) {
         throw new Error(`Missing required flag --${key}`)
      }
   }






   return flags


}