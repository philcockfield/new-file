[![Build Status](https://travis-ci.org/philcockfield/new-file.svg?branch=master)](https://travis-ci.org/philcockfield/new-file)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)


![Title](https://cloud.githubusercontent.com/assets/185555/25560728/018b33d8-2db0-11e7-8f37-2e1f7ba6e8a6.png)

Super simple file templates, no fuss, just the way you like them.

![Video](https://user-images.githubusercontent.com/185555/41954049-3f4e20f2-7a2d-11e8-92a1-8b6cc2a6950d.gif)

## Install

    npm install -g new-file


## .template.yml

Create folders that contain the files that make up your template.

Include a `.template.yml` file within the folder defining the template and `variable` parameters to insert into the files:

```yaml
# .template.yml

name: React Component (TSX)
folder: NAME
install: true # Optionally `{yarn|npm} install` on the folder (default: false).
variables:
  NAME: Component name
  DESCRIPTION: Description
  NAMESPACE: Storybook namespace
```

The folder `NAME` is taken as a parameter from the command line. Each variable key (eg `NAME`, `DESCRIPTION`, `NAMESPACE`) is inserted into the files where the variable name is surrunded by double `__`, eg:

```tsx
export class __NAME__ extends React.Component<I__NAME__Props> {
  public render() {
    return <div>__NAME__</div>;
  }
}
```

## .templates.yml

Place an index in some containing folder where want the templates to be accessible via the command-line from, eg:

```yaml
# .templates.yml

templateDirs:
  - code/templates/*/
  - helpers/my-other-templates/*/
```


## package.json
If you are creating a template that contains a `package.json` file within it, you can use the special `__LATEST__` version value for dependencies.  The generator will retrieve the latest version of the module from NPM and insert it.


```json
{
  "name": "__NAME__",
  "version": "0.0.0",
  "dependencies": {
    "ramda": "__LATEST__"
  },
  "devDependencies": {
    "electron": "__LATEST__",
  },
}
```

NOTE: If you are already using `LATEST` as a variable name, your variable name will override this feature.

