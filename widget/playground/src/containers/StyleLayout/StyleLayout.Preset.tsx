import type { ColorsTypes, PresetTypes } from './StyleLayout.types';
import type { ColorsType } from '../../types';

import { Button, Divider, Switch, Typography } from '@arlert-dev/ui';
import React, { useState } from 'react';

import { DEFAULT_THEME_COLORS, PRESETS } from '../../constants';
import { useTheme } from '../../hooks/useTheme';
import { useConfigStore } from '../../store/config';
import { isPresetSelected, removeDuplicatePresets } from '../../utils/colors';

import { CustomColorsSection } from './StyleLayout.CustomColors';
import {
  Collapse,
  ColoredCircle,
  ColorsContent,
  Line,
  MoreButtonContent,
  PresetContent,
  PresetTheme,
  Row,
} from './StyleLayout.styles';

const Colors = (props: ColorsTypes) => {
  return (
    <ColorsContent>
      <ColoredCircle style={{ backgroundColor: props.primary }} />
      <ColoredCircle
        style={{ backgroundColor: props.secondary }}
        position="absolute"
      />
      <ColoredCircle
        style={{ backgroundColor: props.background }}
        position="relative"
      />
    </ColorsContent>
  );
};

const EACH_COL_HEIGHT = 41;
const TWO_ROWS_NUMBER_OF_COLS = 4;
const ONE_ROW_NUMBER_OF_COLS = 2;
export function Preset(props: PresetTypes) {
  const { activeStyle } = useTheme();

  const { theme } = useConfigStore.use.config();
  const { tab } = props;
  const [showMore, setShowMore] = useState({
    tab,
    value: false,
  });
  const [selectedPreset, setSelectedPreset] = useState<ColorsType>({
    light: theme?.colors?.light || {},
    dark: theme?.colors?.dark || {},
  });
  const isShowMore = showMore.value && tab === showMore.tab;

  const onChangeTheme = useConfigStore.use.onChangeTheme();
  const onSelectTheme = useConfigStore.use.onSelectTheme();
  const isDarkTab = tab === 'dark';
  const isLightTab = tab === 'light';
  const isAutoTab = tab === 'auto';
  let PRESETS_FILTER = PRESETS.filter(
    (preset) =>
      ((isDarkTab || isLightTab) && !!preset[tab]) ||
      (isAutoTab && !!preset.dark && !!preset.light)
  );
  PRESETS_FILTER = isLightTab
    ? removeDuplicatePresets(PRESETS_FILTER)
    : PRESETS_FILTER;
  const presetsSize = PRESETS_FILTER.length;
  const more =
    presetsSize -
    (isAutoTab ? ONE_ROW_NUMBER_OF_COLS : TWO_ROWS_NUMBER_OF_COLS);

  const height = !isShowMore
    ? EACH_COL_HEIGHT * 2
    : EACH_COL_HEIGHT * (isAutoTab ? presetsSize : Math.ceil(presetsSize / 2));

  const onSelectPreset = (preset: ColorsType) => {
    const selectedPreset = isAutoTab ? preset : { [tab]: preset[tab] };
    onSelectTheme(selectedPreset);
    setSelectedPreset(selectedPreset);
    onChangeTheme({ name: 'singleTheme', value: isAutoTab ? undefined : true });
    if (!isAutoTab) {
      onChangeTheme({ name: 'mode', value: tab });
    }
  };
  return (
    <>
      {isAutoTab && (
        <>
          <Row>
            <Typography variant="label" size="medium" color="neutral700">
              Show Widget in Dark Theme
            </Typography>
            <Switch
              checked={activeStyle.indexOf('dark') !== -1}
              onChange={(checked) =>
                onChangeTheme({
                  name: 'mode',
                  value: checked ? 'dark' : 'light',
                })
              }
            />
          </Row>
          <Divider size={10} />
        </>
      )}
      <Collapse style={{ height }}>
        <PresetContent
          style={{ gridTemplateColumns: !isAutoTab ? 'auto auto' : 'auto' }}>
          {PRESETS_FILTER.map((preset) => (
            <PresetTheme
              variant="default"
              isSelected={isPresetSelected(preset, selectedPreset, tab)}
              key={preset.id}
              onClick={() =>
                onSelectPreset({
                  dark: preset.dark,
                  light: preset.light,
                })
              }>
              {!isAutoTab ? (
                <Colors
                  primary={preset[tab]?.primary}
                  secondary={preset[tab]?.secondary}
                  background={preset[tab]?.background}
                />
              ) : (
                <Row style={{ justifyContent: 'space-around' }}>
                  <Colors
                    primary={preset?.light?.primary}
                    secondary={preset?.light?.secondary}
                    background={preset?.light?.background}
                  />
                  <Colors
                    primary={preset?.dark?.primary}
                    secondary={preset?.dark?.secondary}
                    background={preset?.dark?.background}
                  />
                </Row>
              )}
            </PresetTheme>
          ))}
        </PresetContent>
      </Collapse>
      {more > 0 && (
        <MoreButtonContent>
          <Divider size={4} />
          <Button
            size={'small'}
            variant="ghost"
            onClick={() =>
              setShowMore((prev) => ({
                value: tab === prev.tab ? !prev.value : true,
                tab,
              }))
            }>
            {!isShowMore ? `+${more} More` : 'See Less'}
          </Button>
        </MoreButtonContent>
      )}
      <Divider size={16} />
      <Line />
      <Divider size={4} />

      <CustomColorsSection
        tab={tab}
        selectedPreset={selectedPreset}
        onResetPreset={() => setSelectedPreset(DEFAULT_THEME_COLORS)}
      />
    </>
  );
}
