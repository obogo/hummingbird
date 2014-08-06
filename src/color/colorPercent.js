color.colorPercent = function(percents, rgbColors) {
        var i = 0,
            len = percents ? percents.length : 0,
            percentColors = [],
            defaultPercentColors = [
                { pct: 0.0, color: { r: 0x00, g: 0x99, b: 0x00 } },
                { pct: 0.5, color: { r: 0xff, g: 0xff, b: 0x00 } },
                { pct: 1.0, color: { r: 0xff, g: 0x00, b: 0x00 } }
            ];

        if (percents && rgbColors) {
            while (i < len) {
                percentColors.push(percents[i], rgbColors[i]);
                i += 1;
            }
        } else if (percents) {
            percentColors = percents;
        } else {
            percentColors = defaultPercentColors;
        }

        function getRGB(pct) {
            var i = 0, len = percentColors.length, lower, upper, range, rangePct, pctLower, pctUpper, color, result;
            if (pct >= 1) {
                i = len;
            }
            while (i < len) {
                if (pct <= percentColors[i].pct) {
                    lower = (i === 0) ? percentColors[i] : percentColors[i - 1];
                    upper = (i === 0) ? percentColors[i + 1] : percentColors[i];
                    range = upper.pct - lower.pct;
                    rangePct = (pct - lower.pct) / range;
                    pctLower = 1 - rangePct;
                    pctUpper = rangePct;
                    color = {
                        r: Math.floor(lower.color.r * pctLower + upper.color.r * pctUpper),
                        g: Math.floor(lower.color.g * pctLower + upper.color.g * pctUpper),
                        b: Math.floor(lower.color.b * pctLower + upper.color.b * pctUpper)
                    };
                    return color;
                    // or output as hex if preferred
                }
                i += 1;
            }
            color = percentColors[percentColors.length - 1].color;
            return color;
        }

        function convertRGBToStr(rgb) {
            return 'rgb(' + [rgb.r, rgb.g, rgb.b].join(',') + ')';
        }

        function getRGBStr(percent) {
            var rgb = getRGB(percent);
            return convertRGBToStr(rgb);
        }

        return {
            getRGB: getRGB,
            getRGBStr: getRGBStr,
            convertRGBToStr: convertRGBToStr
        };
    };