class SourcePluginInterface {

    /**
     * @return {Promise<{Array}>}
     */
    getCurrencies() {}

    /**
     *
     * @param codeFrom {string}
     * @param codeTo {string}
     * @return {Promise<{Number}>}
     */
    fromToCurrency(codeFrom, codeTo) {}

    /**
     * @return {Promise<{Array}>}
     */
    loadCurrencies() {}

}
export {
    SourcePluginInterface
}