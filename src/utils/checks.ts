import { CharCodes } from './ascii.code'

/**
 * Checks if the character is standard whitespace (space, tab, newline, carriage return).
 */
export function IsWhiteSpace(code: number) {
	return code === CharCodes.Space || code === CharCodes.Tab || code === CharCodes.LineFeed || code === CharCodes.CarriageReturn
}

/**
 * Checks if the character is a digit (0-9).
 */
export function IsDigit(code: number) {
	return code >= CharCodes.Zero && code <= CharCodes.Nine
}

/**
 * Checks if the character is an English letter (a-z, A-Z).
 */
export function IsAlpha(code: number) {
	return (code >= CharCodes.LowerA && code <= CharCodes.LowerZ) || (code >= CharCodes.UpperA && code <= CharCodes.UpperZ)
}

/**
 * Checks if the character is any kind of quote (single, double, or backtick).
 */
export function IsQuote(code: number): boolean {
	return code === CharCodes.SingleQuote || code === CharCodes.DoubleQuote || code === CharCodes.Backtick
}

/*
 * Checks if a character can start a Js Identifier (a-z, A-Z, _, $)
 */

export function IsIdentifierStart(code: number): boolean {
	return IsAlpha(code) || code === CharCodes.Underscore || code === CharCodes.DollarSign
}

/*
 * checks if a character can be part of a js Identifier (adds 0-9)
 */
export function IsIdentifierPart(code: number): boolean {
	return IsIdentifierStart(code) || IsDigit(code)
}
