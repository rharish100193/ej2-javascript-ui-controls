import { StockChart } from '../stock-chart';
import { PeriodsModel, Chart, TechnicalIndicatorModel } from '../../index';
import { AxisModel, RowModel, ExportType, TrendlineTypes, TrendlineModel, TechnicalIndicators, ChartSeriesType } from '../../index';
import { getElement, StockSeriesModel } from '../../index';
import { DropDownButton, MenuEventArgs } from '@syncfusion/ej2-splitbuttons';
import { Button } from '@syncfusion/ej2-buttons';
import { ItemModel } from '@syncfusion/ej2-navigations';
import { Rect } from '../../common/utils/helper';

/**
 * Period selector for range navigator
 */

/** @private */
export class ToolBarSelector {
    private stockChart: StockChart;
    private intervalTypes: string[] = ['Years', 'Quarter', 'Months', 'Weeks', 'Days', 'Hours', 'Minutes', 'Seconds'];
    private indicatorDropDown: DropDownButton;
    private trendlineDropDown: DropDownButton;
    constructor(chart: StockChart) {
        this.stockChart = chart;
    }

    public initializePeriodSelector(): void {
        let periods: PeriodsModel[] = this.stockChart.periods.length ? this.stockChart.periods : this.calculateAutoPeriods();
        this.stockChart.periods = periods;
        this.stockChart.periodSelector.rootControl = this.stockChart;
        let rect : Rect = this.stockChart.chart.chartAxisLayoutPanel.seriesClipRect;
        let htmlElement : HTMLElement = getElement(this.stockChart.element.id + '_Secondary_Element') as HTMLElement;
        let height : number = this.stockChart.toolbarHeight;
        this.stockChart.periodSelector.appendSelector({thumbSize: 0, element: htmlElement, width: rect.width, height: height},
                                                      rect.x);
        this.initializeSeriesSelector();
        this.initializeIndicatorSelector();
        this.initializeTrendlineSelector();
        this.exportButton();
        this.printButton();
        this.resetButton();
    }

    /**
     * This method returns itemModel for dropdown button
     * @param type 
     */
    private getDropDownItems(type: ChartSeriesType[] | TechnicalIndicators[] | ExportType[] | TrendlineTypes[]): ItemModel[] {
        let result: ItemModel[] = [];
        if (type === this.stockChart.seriesType) {
            for (let i: number = 0; i < type.length; i++) {
                result.push({ text: '&nbsp;&nbsp;&nbsp;' + type[i].toString() });
            }
            for (let i: number = 0; i < this.stockChart.series.length; i++) {
                for (let j: number = 0; j < result.length; j++) {
                    let text: string = result[j].text.replace('&nbsp;&nbsp;&nbsp;', '');
                    text = (text === 'OHLC') ? 'HiloOpenClose' : text;
                    if (text === this.stockChart.series[i].type) {
                        result[j].text = result[j].text.replace('&nbsp;&nbsp;&nbsp;', '&#10004&nbsp;');
                    }
                }
            }
        } else if (type === this.stockChart.exportType) {
            for (let i: number = 0; i < type.length; i++) {
                    result.push({ text: type[i].toString() });
            }
        } else {
            for (let i: number = 0; i < type.length; i++) {
                if (type[i].toString() !== 'Print') {
                    result.push({ text: '&nbsp;&nbsp;&nbsp;' + type[i].toString() });
                }
            }
        }
        return result;
    }

    /**
     * This method changes the type of series while selectind series in dropdown button
     */
    private addedSeries(seriesType: string): void {
        let series: StockSeriesModel[] = this.stockChart.series;
        for (let i: number = 0; i < series.length; i++) {
            if (series[i].yName === 'volume') {
                continue;
            }
            series[i].type = <ChartSeriesType>(seriesType.indexOf('Candle') > -1 ? 'Candle' :
            (seriesType.indexOf('OHLC') > -1 ? 'HiloOpenClose' : seriesType) );
            series[i].enableSolidCandles = seriesType === 'Candle';
            series[i].trendlines.forEach((trendLine: TrendlineModel) => {
                trendLine.animation.enable = false;
                trendLine.enableTooltip = false;
            });
        }
    }
    public initializeSeriesSelector(): void {
        let seriesType: DropDownButton = new DropDownButton({
            items: this.getDropDownItems(this.stockChart.seriesType),
            select: (args: MenuEventArgs) => {
                let text: string = this.tickMark(args);
                this.addedSeries(text);
                this.stockChart.cartesianChart.initializeChart();
            },
        });
        seriesType.appendTo('#seriesType');
    }

    //private variables:
    private trendline: TrendlineTypes;
    private indicators: TechnicalIndicators[] = [];
    private secondayIndicators: TechnicalIndicators[] = [];
    public resetButton(): void {
        let reset: Button = new Button({ cssClass: 'e-flat' });
        reset.appendTo('#resetClick');
        document.getElementById('resetClick').onclick = () => {
            let indicatorlength: number = this.indicators.length;
            while (indicatorlength) {
                this.stockChart.indicators.pop();
                indicatorlength--;
            }
            this.indicators = [];
            this.secondayIndicators = [];
            if (!this.stockChart.isSingleAxis) {
                if (this.stockChart.rows.length > 2) {
                    this.stockChart.rows.splice(2, this.stockChart.rows.length - 1);
                }
                if (this.stockChart.axes.length > 2) {
                    this.stockChart.axes.splice(1, this.stockChart.axes.length - 1);
                    this.stockChart.axes[0].rowIndex = 1;
                }
            } else {
                this.stockChart.rows = [{}];
            }
            for (let i: number = 0; i < this.stockChart.series.length; i++) {
                if (this.stockChart.series[i].yName === 'volume') {
                    continue;
                }
                this.stockChart.series[i].type = this.stockChart.tempSeriesType[i];
                if (this.stockChart.series[i].trendlines.length !== 0) {
                    this.stockChart.series[i].trendlines[0].width = 0;
                }
            }
            this.stockChart.indicatorElements = null;
            this.stockChart.resizeTo = null;
            this.stockChart.zoomChange = false;
            for (let j: number = 0; j < this.stockChart.series.length; j++) {
                this.stockChart.series[j].dataSource = this.stockChart.tempDataSource[j];
            }
            this.stockChart.refresh();
        };
    }
    public initializeTrendlineSelector(): void {
        this.trendlineDropDown = new DropDownButton({
            items: this.stockChart.resizeTo ? this.trendlineDropDown.items :
            this.getDropDownItems(this.stockChart.trendlineType),
            select: (args: MenuEventArgs) => {
                let text: string = this.tickMark(args);
                text = text.split(' ')[0].toLocaleLowerCase() + (text.split(' ')[1] ? text.split(' ')[1] : '');
                text = text.substr(0, 1).toUpperCase() + text.substr(1);
                let type: TrendlineTypes = <TrendlineTypes>text;
                if (this.trendline !== type) {
                    this.trendline = type;
                    for (let i: number = 0; i < this.stockChart.series.length; i++) {
                        if (this.stockChart.series[i].yName === 'volume') {
                            continue;
                        }
                        if (this.stockChart.series[0].trendlines.length === 0) {
                            let trendlines: TrendlineModel[];
                            if (this.stockChart.trendlinetriggered) {
                                trendlines = [{ type: type, width: 1, enableTooltip : false }];
                                this.stockChart.trendlinetriggered = false;
                            }
                            this.stockChart.series[0].trendlines = trendlines;
                        } else {
                            this.stockChart.series[0].trendlines[0].width = 1;
                            this.stockChart.series[0].trendlines[0].type = type;
                            this.stockChart.series[0].trendlines[0].animation.enable = this.stockChart.trendlinetriggered ? true : false;
                        }
                    }
                    this.stockChart.cartesianChart.initializeChart();
                } else {
                    args.item.text = '&nbsp;&nbsp;&nbsp;' + args.item.text.replace('&#10004&nbsp;', '');
                    this.stockChart.series[0].trendlines[0].width = 0;
                    this.trendline = null;
                    this.stockChart.cartesianChart.initializeChart();
                }
            },
        });
        this.trendlineDropDown.appendTo('#trendType');
    }
    public initializeIndicatorSelector(): void {
        this.indicatorDropDown = new DropDownButton({
            items: this.stockChart.resizeTo ? this.indicatorDropDown.items :
            this.getDropDownItems(this.stockChart.indicatorType),
            select: (args: MenuEventArgs) => {
                for (let l: number = 0; l < this.stockChart.series.length; l++) {
                    if (this.stockChart.series[l].trendlines.length !== 0) {
                        this.stockChart.series[l].trendlines[0].animation.enable = false;
                    }
                }
                args.item.text = args.item.text.indexOf('&#10004&nbsp;') >= 0 ? args.item.text.substr(args.item.text.indexOf(';') + 1) :
                    args.item.text;
                let text: string = args.item.text.replace('&nbsp;&nbsp;&nbsp;', '');
                text = text.split(' ')[0].toLocaleLowerCase() + (text.split(' ')[1] ? text.split(' ')[1] : '');
                text = text.substr(0, 1).toUpperCase() + text.substr(1);
                let type: TechnicalIndicators = <TechnicalIndicators>text;
                if (type === 'Tma' || type === 'BollingerBands' || type === 'Sma' || type === 'Ema') {
                    if (this.indicators.indexOf(type) === -1) {
                        args.item.text = '&#10004&nbsp;' + args.item.text.replace('&nbsp;&nbsp;&nbsp;', '');
                        let indicator : TechnicalIndicatorModel[] = this.getIndicator(type, this.stockChart.series[0].yAxisName);
                        this.indicators.push(type);
                        this.stockChart.indicators = this.stockChart.indicators.concat(indicator);
                        this.stockChart.cartesianChart.initializeChart();
                    } else {
                        args.item.text = '&nbsp;&nbsp;&nbsp;' + args.item.text;
                        for (let z: number = 0; z < this.stockChart.indicators.length; z++) {
                            if (this.stockChart.indicators[z].type === type) {
                                this.stockChart.indicators.splice(z, 1);
                            }
                        }
                        this.indicators.splice(this.indicators.indexOf(type), 1);
                        this.stockChart.cartesianChart.initializeChart();
                    }
                } else {
                    this.createIndicatorAxes(type, args);
                }
            },
        });
        this.indicatorDropDown.appendTo('#indicatorType');
    }
    private getIndicator(type: TechnicalIndicators, yAxisName: string): TechnicalIndicatorModel[] {
        let indicator: TechnicalIndicatorModel[] = [{
            type: type, period: 3, yAxisName: yAxisName,
            dataSource : this.stockChart.series[0].dataSource,
            xName : this.stockChart.series[0].xName,
            open : this.stockChart.series[0].open,
            close : this.stockChart.series[0].close,
            high : this.stockChart.series[0].high,
            low : this.stockChart.series[0].low,
            volume : this.stockChart.series[0].volume,
            fill: type === 'Sma' ? '#32CD32' : '#6063ff',
            animation: { enable: false }, upperLine: { color: '#FFE200', width: 1 },
            periodLine: { width: 2 }, lowerLine: { color: '#FAA512', width: 1 },
            fastPeriod: 8, slowPeriod: 5, macdType: 'Both', width: 1,
            macdPositiveColor: '#6EC992', macdNegativeColor: '#FF817F',
            bandColor: 'rgba(245, 203, 35, 0.12)',
        }];
        return indicator;
    }
    public createIndicatorAxes(type: TechnicalIndicators, args: MenuEventArgs ): void {
        if (this.indicators.indexOf(type) === -1) {
            args.item.text = '&#10004&nbsp;' + args.item.text.replace('&nbsp;&nbsp;&nbsp;', '');
            this.indicators.push(type);
            let axis: AxisModel[];
            let row: RowModel[];
            let indicator: TechnicalIndicatorModel[];
            let len: number = this.stockChart.rows.length;
            this.stockChart.rows[this.stockChart.rows.length - 1].height = '15%';
            row = [{ height: '' + (100 - len * 15) + 'px' }];
            if (this.stockChart.rows.length === 1) {
                this.stockChart.isSingleAxis = true;
             }
            this.stockChart.rows = this.stockChart.rows.concat(row);
            if (!this.stockChart.isSingleAxis) {
               this.stockChart.axes[0].rowIndex += 1;
             } else {
                for (let i: number = 0; i < this.stockChart.axes.length; i++) {
                    this.stockChart.axes[i].rowIndex += 1;
                }
             }
            axis = [{
                plotOffset: 10, opposedPosition: true,
                rowIndex: (!this.stockChart.isSingleAxis ? this.stockChart.axes.length : 0),
                desiredIntervals: 1,
                labelFormat : 'n2',
                majorGridLines: this.stockChart.primaryYAxis.majorGridLines,
                lineStyle: this.stockChart.primaryYAxis.lineStyle,
                labelPosition : this.stockChart.primaryYAxis.labelPosition,
                majorTickLines: this.stockChart.primaryYAxis.majorTickLines,
                rangePadding: 'None',  name: type.toString(),
            }];
            this.stockChart.axes = this.stockChart.axes.concat(axis);
            this.stockChart.primaryYAxis.rowIndex = (!this.stockChart.isSingleAxis ? 0 : len + 1);
            indicator = this.getIndicator(type, type.toString());
            this.stockChart.indicators = this.stockChart.indicators.concat(indicator);
            this.stockChart.cartesianChart.initializeChart();
        } else {
            args.item.text = '&nbsp;&nbsp;&nbsp;' + args.item.text;
            for (let i: number = 0; i < this.stockChart.indicators.length; i++) {
                if (this.stockChart.indicators[i].type === type) {
                    this.stockChart.indicators.splice(i, 1);
                }
            }
            this.indicators.splice(this.indicators.indexOf(type), 1);
            let removedIndex: number = 0;
            for (let z: number = 0; z < this.stockChart.axes.length; z++) {
                if (this.stockChart.axes[z].name === type) {
                    removedIndex = this.stockChart.axes[z].rowIndex;
                    this.stockChart.rows.splice(z, 1);
                    this.stockChart.axes.splice(z, 1);
                }
            }
            for (let z: number = 0; z < this.stockChart.axes.length; z++) {
                if (this.stockChart.axes[z].rowIndex !== 0 && this.stockChart.axes[z].rowIndex > removedIndex) {
                    this.stockChart.axes[z].rowIndex = this.stockChart.axes[z].rowIndex - 1;
                }
            }
            this.stockChart.cartesianChart.initializeChart();
        }
    }
    public tickMark(args: MenuEventArgs): string {
        let text: string;
        // tslint:disable-next-line:no-string-literal
        let items: ItemModel[] = args.item['parentObj'].items;
        for (let i: number = 0 ; i < items.length; i++ ) {
            items[i].text = items[i].text.indexOf('&#10004&nbsp;') >= 0 ?
            items[i].text.substr(items[i].text.indexOf(';') + 1) :
            items[i].text;
            if ( !(items[i].text.indexOf('&nbsp;&nbsp;&nbsp;') >= 0)) {
                items[i].text = '&nbsp;&nbsp;&nbsp;' + items[i].text;
            }
        }
        if (args.item.text.indexOf('&nbsp;&nbsp;&nbsp;') >= 0) {
            text = args.item.text.replace('&nbsp;&nbsp;&nbsp;', '');
            args.item.text = args.item.text.replace('&nbsp;&nbsp;&nbsp;', '&#10004&nbsp;');
        } else {
            text = args.item.text.replace('&#10004&nbsp;', '');
        }
        return text;
    }
    public printButton(): void {
        if (this.stockChart.exportType.indexOf('Print') > -1) {
            let print: Button = new Button({
                cssClass: 'e-flat'
            });
            print.appendTo('#print');
            document.getElementById('print').onclick = () => {
                    this.stockChart.chart.print(this.stockChart.element.id);
            };
        }
    }
    public exportButton(): void {
        let exportChart: DropDownButton = new DropDownButton({
            items: this.getDropDownItems(this.stockChart.exportType),
            select: (args: MenuEventArgs) => {
                let type: ExportType = <ExportType>args.item.text;
                let stockChart: StockChart = this.stockChart;
                if (stockChart.chart.exportModule) {
                    stockChart.chart.exportModule.export(type, 'StockChart', null, [stockChart], null, stockChart.svgObject.clientHeight);
                }
            }
        });
        exportChart.appendTo('#export');
    }
    public calculateAutoPeriods(): PeriodsModel[] {
        let defaultPeriods: PeriodsModel[] = [];
        let chart: Chart = this.stockChart.chart;
        let axisMin: number = Infinity; let axisMax: number = -Infinity;
        for (let axis of chart.axisCollections) {
            if (axis.orientation === 'Horizontal') {
                axisMin = Math.min(axisMin, axis.visibleRange.min);
                axisMax = Math.max(axisMax, axis.visibleRange.max);
            }
        }
        defaultPeriods = this.findRange(axisMin, axisMax);
        defaultPeriods.push({ text: 'YTD', selected: true }, { text: 'All' });
        return defaultPeriods;
    }

    private findRange(min: number, max: number): PeriodsModel[] {
        let defaultPeriods: PeriodsModel[] = [];
        if (((max - min) / 3.154e+10) >= 1) {
            defaultPeriods.push(
                { text: '1M', interval: 1, intervalType: 'Months' },
                { text: '3M', interval: 3, intervalType: 'Months' },
                { text: '6M', interval: 6, intervalType: 'Months' },
                { text: '1Y', interval: 1, intervalType: 'Years' });
        } else if ((max - min) / 1.577e+10 >= 1) {
            defaultPeriods.push(
                { text: '1M', interval: 1, intervalType: 'Months' },
                { text: '3M', interval: 3, intervalType: 'Months' },
                { text: '6M', interval: 6, intervalType: 'Months' });
        } else if ((max - min) / 2.628e+9 >= 1) {
            defaultPeriods.push(
                { text: '1D', interval: 1, intervalType: 'Days' },
                { text: '3W', interval: 3, intervalType: 'Weeks' },
                { text: '1M', interval: 1, intervalType: 'Months' });
        } else if ((max - min) / 8.64e+7 >= 1) {
            defaultPeriods.push(
                { text: '1H', interval: 1, intervalType: 'Hours' },
                { text: '12H', interval: 12, intervalType: 'Hours' },
                { text: '1D', interval: 1, intervalType: 'Days' },
            );
        }
        return defaultPeriods;
    }
}