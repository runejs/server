import { advancedNumberHookFilter } from './hook-filters'

describe('action/hook hook filters', () => {
    describe('advancedNumberHookFilter', () => {

        describe('when expected is a number array', () => {
            const expected = [ 1, 2, 3 ]

            describe('when input is in the array', () => {
                const input = 2

                test('should return true', () => {
                    const result = advancedNumberHookFilter(expected, input)
    
                    expect(result).toEqual(true)
                })
            })

            describe('when input is not in the array', () => {
                const input = 999

                test('should return false', () => {
                    const result = advancedNumberHookFilter(expected, input)
    
                    expect(result).toEqual(false)
                })
            })
        })
    })
})