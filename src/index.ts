import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import {
  Dialog,
  ISplashScreen
} from '@jupyterlab/apputils';

// import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { ITranslator } from '@jupyterlab/translation';
// import { jupyterFaviconIcon } from '@jupyterlab/ui-components';
import { Throttler } from '@lumino/polling';
import { DisposableDelegate } from '@lumino/disposable';
import '../style/index.css';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
// import ricardo from './ricardo.gif'

/**
 * Initialization data for the splash-screen-ext extension.
 */
// const plugin: JupyterFrontEndPlugin<void> = {
//   id: 'splash-screen-ext:plugin',
//   description: 'A JupyterLab extension.',
//   autoStart: true,
//   optional: [ISettingRegistry],
//   activate: (app: JupyterFrontEnd, settingRegistry: ISettingRegistry | null) => {
//     console.log('JupyterLab extension splash-screen-ext is activated!');

//     if (settingRegistry) {
//       settingRegistry
//         .load(plugin.id)
//         .then(settings => {
//           console.log('splash-screen-ext settings loaded:', settings.composite);
//         })
//         .catch(reason => {
//           console.error('Failed to load settings for splash-screen-ext.', reason);
//         });
//     }
//   }
// };

const SPLASH_RECOVER_TIMEOUT = 120000;

namespace CommandIDs {
  export const loadState = 'apputils:load-statedb';
  export const print = 'apputils:print';
  export const reset = 'apputils:reset';
  export const resetOnLoad = 'apputils:reset-on-load';
  export const runFirstEnabled = 'apputils:run-first-enabled';
  export const runAllEnabled = 'apputils:run-all-enabled';
  export const toggleHeader = 'apputils:toggle-header';
  export const displayShortcuts = 'apputils:display-shortcuts';
}

type SplashScreenKey = 'Ricardo' | 'Shrek' | 'Snow' | 'Fridge' | 'Ratatouille' | 'Pig' | 'Monkey' | 'Ricardo_2' | 'Transformers' | 'SanAndreas' | 'OmNom' | 'Football';

const splashScreenConfig: Record<SplashScreenKey, { path: any; duration: number }> = {
  Ricardo: {
    path: require('../style/images/ricardo.gif'),
    duration: 4.34
  },
  Shrek: {
    path: require('../style/images/shrek.gif'),
    duration: 2.12
  },
  Snow: {
    path: require('../style/images/snow.gif'),
    duration: 4.03
  },
  Fridge: {
    path: require('../style/images/fridge.gif'),
    duration: 1.9
  },
  Ratatouille: {
    path: require('../style/images/ratatouille.gif'),
    duration: 4.55
  },
  Pig: {
    path: require('../style/images/pig.gif'),
    duration: 2.7
  },
  Monkey: {
    path: require('../style/images/monkey.gif'),
    duration: 2.8
  },
  Ricardo_2: {
    path: require('../style/images/ricardo-2.gif'),
    duration: 2.7
  },
  Transformers: {
    path: require('../style/images/transformers.gif'),
    duration: 2.45
  },
  SanAndreas: {
    path: require('../style/images/sa.gif'),
    duration: 2.63
  },
  OmNom: {
    path: require('../style/images/omnom.gif'),
    duration: 9.21
  },
  Football: {
    path: require('../style/images/football.gif'),
    duration: 12.6
  }
};


const splash: JupyterFrontEndPlugin<ISplashScreen> = {
  id: 'splash-screen-ext:custom-splash',
  description: 'Provides the splash screen.',
  autoStart: true,
  requires: [ITranslator, ISettingRegistry],
  provides: ISplashScreen,
  activate: async (app: JupyterFrontEnd, translator: ITranslator, settingRegistry: ISettingRegistry) => {
    const trans = translator.load('jupyterlab');
    const { commands, restored } = app;
    let splashGifSetting = 'Ricardo'; // Default setting
    
    try {
      const settings = await settingRegistry.load('splash-screen-ext:custom-splash');
      splashGifSetting = settings.get('splashGifSetting').composite as string;
      settings.changed.connect(() => {
        splashGifSetting = settings.get('splashGifSetting').composite as string;
      });
    } catch (reason) {
      console.error('Failed to load settings for splash-screen-ext.', reason);
    }

    // Create splash element and populate it.
    const splash = document.createElement('div');
    splash.className = 'splash'
    
    let gifDuration = 5.0;
    const updateSplashContent = () => {
      splash.innerHTML = ''; // Clear previous content
      const key: SplashScreenKey = splashGifSetting as SplashScreenKey;
      const gifPath = splashScreenConfig[key]?.path;
      gifDuration = splashScreenConfig[key]?.duration;
      const splash_gif = document.createElement('img');
      splash_gif.id = 'splash-gif';
      splash_gif.className = 'ricardo-splash';
      splash_gif.src = gifPath; //require('../style/images/ricardo.gif')
      splash.appendChild(splash_gif);
    };
    
    updateSplashContent();


    // const key: SplashScreenKey = splashGifSetting as SplashScreenKey;
    // const gifPath = splashScreenConfig[key]?.path;
    // const gifDuration = splashScreenConfig[key]?.duration;

    // const splash_gif = document.createElement('img');
    // splash_gif.id = 'splash-gif';
    // splash_gif.className = 'ricardo-splash';
    // splash_gif.src = gifPath; //require('../style/images/ricardo.gif')
    // splash.appendChild(splash_gif);


    // Create debounced recovery dialog function.
    let dialog: Dialog<unknown> | null;
    const recovery = new Throttler(
      async () => {
        if (dialog) {
          return;
        }

        dialog = new Dialog({
          title: trans.__('Loading…'),
          body: trans.__(`The loading screen is taking a long time.
Would you like to clear the workspace or keep waiting?`),
          buttons: [
            Dialog.cancelButton({ label: trans.__('Keep Waiting') }),
            Dialog.warnButton({ label: trans.__('Clear Workspace') })
          ]
        });

        try {
          const result = await dialog.launch();
          dialog.dispose();
          dialog = null;
          if (result.button.accept && commands.hasCommand(CommandIDs.reset)) {
            return commands.execute(CommandIDs.reset);
          }

          // Re-invoke the recovery timer in the next frame.
          requestAnimationFrame(() => {
            // Because recovery can be stopped, handle invocation rejection.
            void recovery.invoke().catch(_ => undefined);
          });
        } catch (error) {
          /* no-op */
        }
      },
      { limit: SPLASH_RECOVER_TIMEOUT, edge: 'trailing' }
    );

    // Return ISplashScreen.
    let splashCount = 0;
    
    return {
      show: (light = true) => {
        splash.classList.remove('splash-fade');
        splash.classList.toggle('light', light);
        splash.classList.toggle('dark', !light);
        splashCount++;
        updateSplashContent();
        document.body.appendChild(splash);

        // Because recovery can be stopped, handle invocation rejection.
        void recovery.invoke().catch(_ => undefined);
        
        
        return new DisposableDelegate(async () => {
          await restored;
          
          if (--splashCount === 0) {
            void recovery.stop();

            if (dialog) {
              dialog.dispose();
              dialog = null;
            }
            setTimeout(() => {
              splash.classList.add('splash-fade');
              window.setTimeout(() => {
                document.body.removeChild(splash);
              }, 200);
            }, gifDuration * 1000)
          }
        });
      }
    };
  }
};





export default splash;
