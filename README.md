# splash_screen_ext

An extension for JupyterLab that replaces the default Splash Screen with a custom GIF. The selection of GIFs is predefined and limited.

## Features

To change the GIF on the Splash Screen, follow these steps:

1. Open the **Settings Editor**;
2. Navigate to the **Custom Splash** section;
3. Select a new GIF from the dropdown menu.

## Adding Your Own GIF

To add your own custom GIF, follow these steps:

1. Clone the repository:  
   ```bash
   git clone https://github.com/MrCrashLab/splash_screen_ext.git
   ```
2. Add your GIF to the ```style/images/``` directory.
3. Update the ```splashScreenConfig``` dictionary in the ```src/index.ts``` file by adding the path to your GIF and its duration.
4. In the ```schema/custom-splash.json``` file, add the key name from step 3 to the enum section.