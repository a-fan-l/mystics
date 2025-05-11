import storage from '@mystics/libs';

import useModeStore, { ThemeMode } from './store/mode';
import { MODE_STORAGE_KEY } from './constant/mode';

const useMode = () => {
  const { mode, open, ...actions } = useModeStore();

  const modify = (params: ThemeMode) => {
      if (params === mode) return;
      actions.change(params);
      storage.setItem({ key: MODE_STORAGE_KEY, value: params });
  };

  // 切换语言的方法
  const change = (params: ThemeMode) => {
      if (params === mode) return;
      modify(params);
  };
  
  const setup = () => {
      if (typeof window !== 'undefined') {
        const res = storage.getItem({ key: MODE_STORAGE_KEY });
        if (res) {
          modify(res as ThemeMode);
        }
      }
  };

  return {
    mode,
    open,
    show: actions.show,
    change,
    modify,
    setup,
  };
};

export { useMode, ThemeMode, useModeStore };