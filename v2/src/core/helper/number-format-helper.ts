import BigNumber from 'bignumber.js'
import { EthValue } from '@core/models'
import Configs from '@/configs'
import { NETWORKS } from '@/core/helper/networks'
BigNumber.config({ ROUNDING_MODE: 1 }) // equivalent to ROUND_DOWN

const FormattedNumberUnitETH = NETWORKS[Configs.NETWORK].curr

export enum FormattedNumberUnit {
    GWEI = 'gwei',
    WEI = 'wei',
    PERCENT = '%',
    USD = '$',
    B = 'B',
    T = 'T',
    Q = 'Q',
    M = 'M',
    K = 'k'
}

export interface FormattedNumber {
    value: string
    unit?: FormattedNumberUnit | string
    tooltipText?: string
}

/* Constants: */
const SmallUsdBreakpoint = 0.04
const SmallNumberBreakpoint = 0.0000001
const SmallGweiBreakpoint = 0.00001

const OneThousand = 1e3
const TenThousand = 1e4
const HundredThousand = 1e5
const OneMillion = 1e6
const OneBillion = 1e9
const HundredBillion = 1e11
const OneTrillion = 1e12
const OneQuadrillion = 1e15

/* Helper functions */

const convertToThousands = (value: BigNumber): FormattedNumber => {
    const result = value.dividedBy(OneThousand)
    return {
        value: `${result.toFormat(Math.min(2, result.decimalPlaces()))}k`,
        unit: FormattedNumberUnit.K,
        tooltipText: value.toFormat()
    }
}

const convertToMillions = (value: BigNumber): FormattedNumber => {
    const result = value.dividedBy(OneMillion)
    return {
        value: `${result.toFormat(Math.min(2, result.decimalPlaces()))}M`,
        unit: FormattedNumberUnit.M,
        tooltipText: value.toFormat()
    }
}

const convertToBillions = (value: BigNumber): FormattedNumber => {
    const result = value.dividedBy(OneBillion)
    return {
        value: `${result.toFormat(Math.min(3, result.decimalPlaces()))}B`,
        unit: FormattedNumberUnit.B,
        tooltipText: value.toFormat()
    }
}

const convertToTrillions = (value: BigNumber): FormattedNumber => {
    const result = value.dividedBy(OneTrillion)
    return {
        value: `${result.toFormat(Math.min(3, result.decimalPlaces()))}T`,
        unit: FormattedNumberUnit.T,
        tooltipText: value.toFormat()
    }
}

const convertToQuadrillion = (value: BigNumber): FormattedNumber => {
    return { value: '> 1Q', unit: FormattedNumberUnit.Q, tooltipText: value.toFormat() }
}

export const getRoundNumber = (value: BigNumber, round: number, dp: any): FormattedNumber => {
    return { value: value.toFormat(Math.min(round, dp)), tooltipText: dp > round ? value.toFormat() : undefined }
}

/**
 * General: Formatted integers
 * E.g. Block Number
 * Numbers that do not need  formating methods
 */

/**
 * GFormatted integers
 * Converts an integer value to a FormattedNumber object, returns value in { billions, trillions, "> 1Q"} if > 1 billion
 * @param value: BigNumber
 * @return FormattedNumber
 */
export const formatIntegerValue = (value: BigNumber, isSmaller = false): FormattedNumber => {
    /* Case I: value >= 1,000,000,000,000,000 */
    if (value.isGreaterThanOrEqualTo(OneQuadrillion)) {
        return convertToQuadrillion(value)
    }

    /* Case II: value >= 1,000,000,000,000 */
    if (value.isGreaterThanOrEqualTo(OneTrillion)) {
        return convertToTrillions(value)
    }

    /* Case III: value >= 1,000,000,000 */
    if (value.isGreaterThanOrEqualTo(OneBillion)) {
        return convertToBillions(value)
    }
    /* Case: need shorter string for over 1 thousand */
    if (isSmaller) {
        /* Case IV: value >= 1,000,000 */
        if (value.isGreaterThanOrEqualTo(OneMillion)) {
            return convertToMillions(value)
        }

        /* Case V: value >= 1,000 */
        if (value.isGreaterThanOrEqualTo(OneThousand)) {
            return convertToThousands(value)
        }
    }

    /* Case IV: value < 1,000,000,000 and !isSmaller */
    return { value: value.toFormat() }
}

/**
 * Floating point values
 * Converts a floating point value to a FormattedNumber object
 * Use cases: Token Balances / Quantities / Non Detail page for floating numbers
 * @param value BigNumber
 * @returns Object FormattedNumber with value as formatted string, unit and tooltipText
 */
export const formatFloatingPointValue = (value: BigNumber): FormattedNumber => {
    const dps = value.decimalPlaces()

    /**
     * Case I: value === 0
     * Return: "0"
     */
    if (value.isZero()) {
        return { value: '0' }
    }

    /**
     * Case II: value >= 1,000,000,000
     * Return: formated integer value with tooltip
     */
    if (value.isGreaterThanOrEqualTo(OneBillion)) {
        return formatIntegerValue(value)
    }

    /**
     * Case III: value >= 1,000,000
     * Return: round number and tooltip with full value if there are decimal places
     */
    if (value.isGreaterThanOrEqualTo(OneMillion)) {
        return getRoundNumber(value, 0, dps)
    }

    /**
     * Case IV: value >= 10,000
     * Return: a number, rounded to 2 decimal points and tooltip with full value if > 2 decimal places
     */
    if (value.isGreaterThanOrEqualTo(TenThousand)) {
        return getRoundNumber(value, 2, dps)
    }

    /**
     * Case IV: value >= 1
     * Return: a number, rounded to 4 decimal points and tooltip with full value if > 4 decimal places
     */
    if (value.isGreaterThanOrEqualTo(1)) {
        return getRoundNumber(value, 4, dps)
    }

    /**
     * Case V: value >= 0.0000001
     * Return: a number, rounded up to 7 decimal places and tooltip with full value if > 7 decimal places
     */
    if (value.isGreaterThanOrEqualTo(SmallNumberBreakpoint)) {
        return getRoundNumber(value, 7, dps)
    }

    /**
     * Case V: value < 0.0000001
     * Return: string "< 0.0000001" and tooltip with full value
     */
    return { value: '< 0.0000001', tooltipText: dps ? value.toFormat() : undefined }
}

/**
 * Variable unit ETH values, used in details pages
 * Converts a value from wei to a formatted string in an appropriate unit
 * @param value BigNumber - must be original wei value (not already converted to Eth)
 * @returns  Object FormattedNumber with value as formatted string, unit and tooltipText
 */
export const formatVariableUnitEthValue = (value: BigNumber): FormattedNumber => {
    /**
     * Case I: value === 0
     * Return: "0 ETH"
     */
    if (value.isZero()) {
        return { value: '0', unit: FormattedNumberUnitETH }
    } else if (value.isLessThan(TenThousand)) {
        /**
         * Case II: value < 10,000 wei
         * Return: small values in WEI (no conversion) and tooltip with ETH value
         */
        return {
            value: value.toFormat(),
            unit: FormattedNumberUnit.WEI,
            tooltipText: `${new EthValue(value).toEthBN().toFixed()}`
        }
    } else if (value.isLessThan(HundredBillion)) {
        /**
         * Case III: value < 100 Billion Wei OR value < 100 Gwei
         * Return: Gwei value, using Group II
         */
        const gweiBN = new EthValue(value).toGweiBN()
        return {
            value: formatFloatingPointValue(gweiBN).value,
            unit: FormattedNumberUnit.GWEI,
            tooltipText: `${new EthValue(value).toEthBN().toFixed()}`
        }
    }

    const ethBN = new EthValue(value).toEthBN()
    const unit = FormattedNumberUnitETH
    const dps = ethBN.decimalPlaces()

    /**
     * Case IV: 0.0000001 Eth <= X < 1 Eth
     * Return: rounded number to 12 dps
     */
    if (ethBN.isLessThan(1)) {
        return { ...getRoundNumber(ethBN, 12, dps), unit }
    }

    /**
     * Case V: 1 Eth <= X < 100,000 Eth
     * Return: rounded number to 6 dps
     */
    if (ethBN.isLessThan(HundredThousand)) {
        return { ...getRoundNumber(ethBN, 6, dps), unit }
    }

    /**
     * Case VI: 100,000 <= X < 1 mill
     * Return: rounded number to 4 dps
     */
    if (ethBN.isLessThan(OneMillion)) {
        return { ...getRoundNumber(ethBN, 4, dps), unit }
    }

    /**
     * Case VII: 1 mill <= X < 1 Bill
     * Return: rounded number to 0 dps
     */
    if (ethBN.isLessThan(OneBillion)) {
        return { ...getRoundNumber(ethBN, 0, dps), unit }
    }

    /**
     * Case VIII: V >= 1 Billion
     * Return: Group I formatted value
     */
    return { ...formatIntegerValue(ethBN), unit }
}

/**
 * Non-variable ETH values
 * Convert a value in WEI to ETH
 * @param value: BigNumber (in wei)
 * @return FormattedNumber with value converted to ETH and tooltip if maxDecimalPlaces was applied
 */
export const formatNonVariableEthValue = (value: BigNumber): FormattedNumber => {
    /**
     * Case I: value === 0
     * Return: "0 ETH"
     */
    if (value.isZero()) {
        return { value: '0', unit: FormattedNumberUnitETH }
    } else if (value.isLessThan(TenThousand)) {
        /**
         * Case II: value < 10,000 wei
         * Return: small values in WEI (no conversion) and tooltip with ETH value
         */
        return {
            value: value.toFormat(),
            unit: FormattedNumberUnit.WEI,
            tooltipText: `${new EthValue(value).toEthBN().toFixed()}`
        }
    } else if (value.isLessThan(HundredBillion)) {
        /**
         * Case III: value < 100 Billion Wei OR value < 100 Gwei
         * Return: Gwei value, using Group II
         */
        const gweiBN = new EthValue(value).toGweiBN()
        return {
            value: formatFloatingPointValue(gweiBN).value,
            unit: FormattedNumberUnit.GWEI,
            tooltipText: `${new EthValue(value).toEthBN().toFixed()}`
        }
    }

    const ethBN = new EthValue(value).toEthBN()
    return { ...formatFloatingPointValue(ethBN), unit: FormattedNumberUnitETH }
}

/**
 * Non-variable GWei values
 * Convert a value from WEI to GWEI
 * @param value BigNumber (in wei)
 * @return FormattedNumber with value in GWei and unit
 */
export const formatNonVariableGWeiValue = (value: BigNumber): FormattedNumber => {
    const gweiBN = new EthValue(value).toGweiBN()
    const unit = FormattedNumberUnit.GWEI

    /**
     * Case I: value === 0
     * Return: "0 ETH"
     */
    if (gweiBN.isZero()) {
        return { value: '0', unit }
    }

    /**
     * Case II: x < 0.00001
     * Return: number in wei and show tooltip with Gwei value
     */
    if (gweiBN.isLessThan(SmallGweiBreakpoint)) {
        return {
            value: value.toFormat(),
            unit,
            tooltipText: `${gweiBN.toFormat()} ${unit}`
        }
    }

    /**
     * Case III: x < 1 mill
     * Return: number in Gwei using Group II
     */

    if (gweiBN.isLessThan(OneMillion)) {
        return { ...formatFloatingPointValue(gweiBN), unit, tooltipText: `${new EthValue(value).toEthBN().toFixed()}` }
    }

    /**
     * Case IV: x >= 1 mill
     * Return: number in eth and show tooltip with Gwei value
     */
    return {
        ...formatNonVariableEthValue(value),
        unit,
        tooltipText: `${gweiBN.toFixed()} ${unit}`
    }
}

/**
 * Percentage values
 * Converts a percentage value to a FormattedNumber
 * @param value: BigNumber already converted to a percentage e.g. < 100 (expect in special cases)
 * @returns Object FormattedNumber with value as formatted string, unit and tooltipText
 */
export const formatPercentageValue = (value: BigNumber | number): FormattedNumber => {
    // Convert to BigNumber if necessary
    if (!(value instanceof BigNumber)) {
        value = new BigNumber(value)
    }
    const unit = FormattedNumberUnit.PERCENT

    /**
     * Case I: value === 0
     * Return: "0%"
     */
    if (value.isZero()) {
        return { value: '0', unit }
    }

    const isNegative = value.isNegative() // Record whether value is negative
    const absoluteValue = value.absoluteValue() // Get Absolute value
    const dps = value.decimalPlaces()

    /**
     * Case II: |value| >= 1000
     * Return: >1000 or <-1000 and tooltip
     */
    if (absoluteValue.isGreaterThanOrEqualTo(1000)) {
        const result = isNegative ? '< -1000' : '> 1000'
        return { value: result, unit, tooltipText: `${value.toFormat()}%` }
    }

    /**
     * Case III: |value| >= 100
     * Return: whole number and tooltips if has decimal points
     */
    if (absoluteValue.isGreaterThanOrEqualTo(100)) {
        return { value: value.toFormat(0), unit, tooltipText: dps ? `${value.toFormat()}%` : undefined }
    }

    /**
     * Case IV: |value| >= 0.01
     * Return: rounded to 2 decimal points number and tooltip if > 2 decimal points
     */
    if (absoluteValue.isGreaterThanOrEqualTo(0.01)) {
        return { ...getRoundNumber(value, 2, dps), unit, tooltipText: dps > 2 ? `${value.toFormat()}%` : undefined }
    }

    /**
     * Case V: If -0.01 < |value| < 0.01
     * Return: '>-0.01' '<0.01'r and tooltip
     */
    const result = isNegative ? '> -0.01' : '< 0.01'
    return { value: result, unit, tooltipText: `${value.toFormat()}%` }
}

/**
 * USD Values
 * Converts a USD value to a FormattedNumber
 * @param value: BigNumber
 * @returns Object FormattedNumber with value as formatted string, unit and tooltipText
 */
export const formatUsdValue = (value: BigNumber): FormattedNumber => {
    const unit = FormattedNumberUnit.USD
    /**
     * Case I: value === 0
     * Return: "$0.00"
     */
    if (value === undefined || value.isZero()) {
        return { value: '$0.00', unit }
    }

    /**
     * Case II: value >= 1 Quadrillion
     * Return:  value converted to Quadrillions"
     */
    if (value.isGreaterThanOrEqualTo(OneQuadrillion)) {
        const result = convertToQuadrillion(value)
        return { value: `$${result.value}`, unit, tooltipText: result.tooltipText ? `$${result.tooltipText}` : undefined }
    }

    /**
     * Case II: value >= 1 Trillion
     * Return:  value converted to trillions"
     */
    if (value.isGreaterThanOrEqualTo(OneTrillion)) {
        const result = convertToTrillions(value)
        return { value: `$${result.value}`, unit, tooltipText: result.tooltipText ? `$${result.tooltipText}` : undefined }
    }

    /**
     * Case III: value >= 1 Billion
     * Return: value converted to billions"
     */
    if (value.isGreaterThanOrEqualTo(OneBillion)) {
        const result = convertToBillions(value)
        return { value: `$${result.value}`, unit, tooltipText: result.tooltipText ? `$${result.tooltipText}` : undefined }
    }

    /**
     * Case IV: value >= 1 Million.
     * Return: rounded number and tolltip if has decimal points"
     */
    if (value.isGreaterThanOrEqualTo(OneMillion)) {
        const result = getRoundNumber(value, 0, value.decimalPlaces())
        return { value: `$${result.value}`, unit, tooltipText: result.tooltipText ? `$${result.tooltipText}` : undefined }
    }

    /**
     * Case V: value > 0.04
     * Return: rounded number up to 2 decimal points and tolltip if > 2 decimal points"
     */
    if (value.isGreaterThan(SmallUsdBreakpoint)) {
        return { value: `$${value.toFormat(2)}`, unit, tooltipText: value && value.decimalPlaces() > 2 ? `$${value.toFormat()}` : undefined }
    }

    /**
     * Case VI: 0.00001 <= value <= 0.04
     * Return: rounded number up to 5 decimal points and tooltip if > 5 decimal points"
     */
    if (value.isGreaterThanOrEqualTo(SmallGweiBreakpoint)) {
        const formatted = value.toFormat(Math.min(5, value.decimalPlaces()))
        return { value: `$${formatted}`, unit, tooltipText: value.decimalPlaces() > 5 ? `$${value.toFormat()}` : undefined }
    }

    /**
     * Case V: value < 0.0000001
     * Return: string "< $0.0000001" and tooltip with full value
     */
    return { value: '< $0.0000001', unit, tooltipText: `$${value.toFixed()}` }
}

export const formatNumber = (value: number): string => {
    return new BigNumber(value).toFormat().toString()
}
