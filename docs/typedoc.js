;(() => {
  const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'
  const INSTALLERS = ['npm', 'yarn', 'bun', 'deno']
  const PREFERENCE_KEY = 'inttegro-docs-installer'

  const logos = {
    inttegro: {
      label: 'Inttegro',
      markup: '<circle cx="12" cy="12" r="9.375" fill="#16a34a"/>',
    },
    npm: {
      label: 'npm',
      markup:
        '<path fill="#CB3837" d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z"/>',
    },
    yarn: {
      label: 'Yarn',
      markup:
        '<path fill="#2C8EBB" d="M12 0C5.375 0 0 5.375 0 12s5.375 12 12 12 12-5.375 12-12S18.625 0 12 0zm.768 4.105c.183 0 .363.053.525.157.125.083.287.185.755 1.154.31-.088.468-.042.551-.019.204.056.366.19.463.375.477.917.542 2.553.334 3.605-.241 1.232-.755 2.029-1.131 2.576.324.329.778.899 1.117 1.825.278.774.31 1.478.273 2.015a5.51 5.51 0 0 0 .602-.329c.593-.366 1.487-.917 2.553-.931.714-.009 1.269.445 1.353 1.103a1.23 1.23 0 0 1-.945 1.362c-.649.158-.95.278-1.821.843-1.232.797-2.539 1.242-3.012 1.39a1.686 1.686 0 0 1-.704.343c-.737.181-3.266.315-3.466.315h-.046c-.783 0-1.214-.241-1.45-.491-.658.329-1.51.19-2.122-.134a1.078 1.078 0 0 1-.58-1.153 1.243 1.243 0 0 1-.153-.195c-.162-.25-.528-.936-.454-1.946.056-.723.556-1.367.88-1.71a5.522 5.522 0 0 1 .408-2.256c.306-.727.885-1.348 1.32-1.737-.32-.537-.644-1.367-.329-2.21.227-.602.412-.936.82-1.08h-.005c.199-.074.389-.153.486-.259a3.418 3.418 0 0 1 2.298-1.103c.037-.093.079-.185.125-.283.31-.658.639-1.029 1.024-1.168a.94.94 0 0 1 .328-.06zm.006.7c-.507.016-1.001 1.519-1.001 1.519s-1.27-.204-2.266.871c-.199.218-.468.334-.746.44-.079.028-.176.023-.417.672-.371.991.625 2.094.625 2.094s-1.186.839-1.626 1.881c-.486 1.144-.338 2.261-.338 2.261s-.843.732-.899 1.487c-.051.663.139 1.2.343 1.515.227.343.51.176.51.176s-.561.653-.037.931c.477.25 1.283.394 1.71-.037.31-.31.371-1.001.486-1.283.028-.065.12.111.209.199.097.093.264.195.264.195s-.755.324-.445 1.066c.102.246.468.403 1.066.398.222-.005 2.664-.139 3.313-.296.375-.088.505-.283.505-.283s1.566-.431 2.998-1.357c.917-.598 1.293-.76 2.034-.936.612-.148.57-1.098-.241-1.084-.839.009-1.575.44-2.196.825-1.163.718-1.742.672-1.742.672l-.018-.032c-.079-.13.371-1.293-.134-2.678-.547-1.515-1.413-1.881-1.344-1.997.297-.5 1.038-1.297 1.334-2.78.176-.899.13-2.377-.269-3.151-.074-.144-.732.241-.732.241s-.616-1.371-.788-1.483a.271.271 0 0 0-.157-.046z"/>',
    },
    bun: {
      label: 'Bun',
      markup:
        '<path fill="currentColor" d="M12 22.596c6.628 0 12-4.338 12-9.688 0-3.318-2.057-6.248-5.219-7.986-1.286-.715-2.297-1.357-3.139-1.89C14.058 2.025 13.08 1.404 12 1.404c-1.097 0-2.334.785-3.966 1.821a49.92 49.92 0 0 1-2.816 1.697C2.057 6.66 0 9.59 0 12.908c0 5.35 5.372 9.687 12 9.687v.001ZM10.599 4.715c.334-.759.503-1.58.498-2.409 0-.145.202-.187.23-.029.658 2.783-.902 4.162-2.057 4.624-.124.048-.199-.121-.103-.209a5.763 5.763 0 0 0 1.432-1.977Zm2.058-.102a5.82 5.82 0 0 0-.782-2.306v-.016c-.069-.123.086-.263.185-.172 1.962 2.111 1.307 4.067.556 5.051-.082.103-.23-.003-.189-.126a5.85 5.85 0 0 0 .23-2.431Zm1.776-.561a5.727 5.727 0 0 0-1.612-1.806v-.014c-.112-.085-.024-.274.114-.218 2.595 1.087 2.774 3.18 2.459 4.407a.116.116 0 0 1-.049.071.11.11 0 0 1-.153-.026.122.122 0 0 1-.022-.083 5.891 5.891 0 0 0-.737-2.331Zm-5.087.561c-.617.546-1.282.76-2.063 1-.117 0-.195-.078-.156-.181 1.752-.909 2.376-1.649 2.999-2.778 0 0 .155-.118.188.085 0 .304-.349 1.329-.968 1.874Zm4.945 11.237a2.957 2.957 0 0 1-.937 1.553c-.346.346-.8.565-1.286.62a2.178 2.178 0 0 1-1.327-.62 2.955 2.955 0 0 1-.925-1.553.244.244 0 0 1 .064-.198.234.234 0 0 1 .193-.069h3.965a.226.226 0 0 1 .19.07c.05.053.073.125.063.197Zm-5.458-2.176a1.862 1.862 0 0 1-2.384-.245 1.98 1.98 0 0 1-.233-2.447c.207-.319.503-.566.848-.713a1.84 1.84 0 0 1 1.092-.11c.366.075.703.261.967.531a1.98 1.98 0 0 1 .408 2.114 1.931 1.931 0 0 1-.698.869v.001Zm8.495.005a1.86 1.86 0 0 1-2.381-.253 1.964 1.964 0 0 1-.547-1.366c0-.384.11-.76.32-1.079.207-.319.503-.567.849-.713a1.844 1.844 0 0 1 1.093-.108c.367.076.704.262.968.534a1.98 1.98 0 0 1 .4 2.117 1.932 1.932 0 0 1-.702.868Z"/>',
    },
    deno: {
      label: 'Deno',
      markup:
        '<path fill="currentColor" d="M1.105 18.02A11.9 11.9 0 0 1 0 12.985q0-.698.078-1.376a12 12 0 0 1 .231-1.34A12 12 0 0 1 4.025 4.02a12 12 0 0 1 5.46-2.771 12 12 0 0 1 3.428-.23c1.452.112 2.825.477 4.077 1.05a12 12 0 0 1 2.78 1.774 12.02 12.02 0 0 1 4.053 7.078A12 12 0 0 1 24 12.985q0 .454-.036.914a12 12 0 0 1-.728 3.305 12 12 0 0 1-2.38 3.875c-1.33 1.357-3.02 1.962-4.43 1.936a4.4 4.4 0 0 1-2.724-1.024c-.99-.853-1.391-1.83-1.53-2.919a5 5 0 0 1 .128-1.518c.105-.38.37-1.116.76-1.437-.455-.197-1.04-.624-1.226-.829-.045-.05-.04-.13 0-.183a.155.155 0 0 1 .177-.053c.392.134.869.267 1.372.35.66.111 1.484.25 2.317.292 2.03.1 4.153-.813 4.812-2.627s.403-3.609-1.96-4.685-3.454-2.356-5.363-3.128c-1.247-.505-2.636-.205-4.06.582-3.838 2.121-7.277 8.822-5.69 15.032a.191.191 0 0 1-.315.19 12 12 0 0 1-1.25-1.634 12 12 0 0 1-.769-1.404M11.57 6.087c.649-.051 1.214.501 1.31 1.236.13.979-.228 1.99-1.41 2.013-1.01.02-1.315-.997-1.248-1.614.066-.616.574-1.575 1.35-1.635"/>',
    },
    javascript: {
      label: 'JavaScript',
      markup:
        '<path fill="#F7DF1E" d="M0 0h24v24H0V0zm22.034 18.276c-.175-1.095-.888-2.015-3.003-2.873-.736-.345-1.554-.585-1.797-1.14-.091-.33-.105-.51-.046-.705.15-.646.915-.84 1.515-.66.39.12.75.42.976.9 1.034-.676 1.034-.676 1.755-1.125-.27-.42-.404-.601-.586-.78-.63-.705-1.469-1.065-2.834-1.034l-.705.089c-.676.165-1.32.525-1.71 1.005-1.14 1.291-.811 3.541.569 4.471 1.365 1.02 3.361 1.244 3.616 2.205.24 1.17-.87 1.545-1.966 1.41-.811-.18-1.26-.586-1.755-1.336l-1.83 1.051c.21.48.45.689.81 1.109 1.74 1.756 6.09 1.666 6.871-1.004.029-.09.24-.705.074-1.65l.046.067zm-8.983-7.245h-2.248c0 1.938-.009 3.864-.009 5.805 0 1.232.063 2.363-.138 2.711-.33.689-1.18.601-1.566.48-.396-.196-.597-.466-.83-.855-.063-.105-.11-.196-.127-.196l-1.825 1.125c.305.63.75 1.172 1.324 1.517.855.51 2.004.675 3.207.405.783-.226 1.458-.691 1.811-1.411.51-.93.402-2.07.397-3.346.012-2.054 0-4.109 0-6.179l.004-.056z"/>',
    },
    typescript: {
      label: 'TypeScript',
      markup:
        '<path fill="#3178C6" d="M1.125 0C.506 0 0 .506 0 1.125v21.75C0 23.494.506 24 1.125 24h21.75c.619 0 1.125-.506 1.125-1.125V1.125C24 .506 23.494 0 22.875 0zm11.42 12.151H9.918v8.474H7.803v-8.474H5.175v-1.726h7.37zm.211 7.98v-2.197s1.2.904 2.64.904c1.44 0 1.388-.94 1.388-1.069 0-1.365-4.092-1.365-4.092-4.413 0-4.15 5.994-2.508 5.994-2.508v1.958s-1.006-.683-2.14-.683c-1.134 0-1.543.54-1.543 1.126 0 1.477 4.092 1.328 4.092 4.32 0 4.595-6.34 2.562-6.34 2.562z"/>',
    },
    react: {
      label: 'React',
      markup:
        '<path fill="#61DAFB" d="M14.23 12.004a2.236 2.236 0 0 1-2.235 2.236 2.236 2.236 0 0 1-2.236-2.236 2.236 2.236 0 0 1 2.235-2.236 2.236 2.236 0 0 1 2.236 2.236zm2.648-10.69c-1.346 0-3.107.96-4.888 2.622-1.78-1.653-3.542-2.602-4.887-2.602-.41 0-.783.093-1.106.278-1.375.793-1.683 3.264-.973 6.365C1.98 8.917 0 10.42 0 12.004c0 1.59 1.99 3.097 5.043 4.03-.704 3.113-.39 5.588.988 6.38.32.187.69.275 1.102.275 1.345 0 3.107-.96 4.888-2.624 1.78 1.654 3.542 2.603 4.887 2.603.41 0 .783-.09 1.106-.275 1.374-.792 1.683-3.263.973-6.365C22.02 15.096 24 13.59 24 12.004c0-1.59-1.99-3.097-5.043-4.032.704-3.11.39-5.587-.988-6.38-.318-.184-.688-.277-1.092-.278zm-.005 1.09v.006c.225 0 .406.044.558.127.666.382.955 1.835.73 3.704-.054.46-.142.945-.25 1.44-.96-.236-2.006-.417-3.107-.534-.66-.905-1.345-1.727-2.035-2.447 1.592-1.48 3.087-2.292 4.105-2.295zm-9.77.02c1.012 0 2.514.808 4.11 2.28-.686.72-1.37 1.537-2.02 2.442-1.107.117-2.154.298-3.113.538-.112-.49-.195-.964-.254-1.42-.23-1.868.054-3.32.714-3.707.19-.09.4-.127.563-.132zm4.882 3.05c.455.468.91.992 1.36 1.564-.44-.02-.89-.034-1.345-.034-.46 0-.915.01-1.36.034.44-.572.895-1.096 1.345-1.565zM12 8.1c.74 0 1.477.034 2.202.093.406.582.802 1.203 1.183 1.86.372.64.71 1.29 1.018 1.946-.308.655-.646 1.31-1.013 1.95-.38.66-.773 1.288-1.18 1.87-.728.063-1.466.098-2.21.098-.74 0-1.477-.035-2.202-.093-.406-.582-.802-1.204-1.183-1.86-.372-.64-.71-1.29-1.018-1.946.303-.657.646-1.313 1.013-1.954.38-.66.773-1.286 1.18-1.868.728-.064 1.466-.098 2.21-.098zm-3.635.254c-.24.377-.48.763-.704 1.16-.225.39-.435.782-.635 1.174-.265-.656-.49-1.31-.676-1.947.64-.15 1.315-.283 2.015-.386zm7.26 0c.695.103 1.365.23 2.006.387-.18.632-.405 1.282-.66 1.933-.2-.39-.41-.783-.64-1.174-.225-.392-.465-.774-.705-1.146zm3.063.675c.484.15.944.317 1.375.498 1.732.74 2.852 1.708 2.852 2.476-.005.768-1.125 1.74-2.857 2.475-.42.18-.88.342-1.355.493-.28-.958-.646-1.956-1.1-2.98.45-1.017.81-2.01 1.085-2.964zm-13.395.004c.278.96.645 1.957 1.1 2.98-.45 1.017-.812 2.01-1.086 2.964-.484-.15-.944-.318-1.37-.5-1.732-.737-2.852-1.706-2.852-2.474 0-.768 1.12-1.742 2.852-2.476.42-.18.88-.342 1.356-.494zm11.678 4.28c.265.657.49 1.312.676 1.948-.64.157-1.316.29-2.016.39.24-.375.48-.762.705-1.158.225-.39.435-.788.636-1.18zm-9.945.02c.2.392.41.783.64 1.175.23.39.465.772.705 1.143-.695-.102-1.365-.23-2.006-.386.18-.63.406-1.282.66-1.933zM17.92 16.32c.112.493.2.968.254 1.423.23 1.868-.054 3.32-.714 3.708-.147.09-.338.128-.563.128-1.012 0-2.514-.807-4.11-2.28.686-.72 1.37-1.536 2.02-2.44 1.107-.118 2.154-.3 3.113-.54zm-11.83.01c.96.234 2.006.415 3.107.532.66.905 1.345 1.727 2.035 2.446-1.595 1.483-3.092 2.295-4.11 2.295-.22-.005-.406-.05-.553-.132-.666-.38-.955-1.834-.73-3.703.054-.46.142-.944.25-1.438zm4.56.64c.44.02.89.034 1.345.034.46 0 .915-.01 1.36-.034-.44.572-.895 1.095-1.345 1.565-.455-.47-.91-.993-1.36-1.565z"/>',
    },
    vue: {
      label: 'Vue',
      markup:
        '<path fill="#4FC08D" d="M24 1.61h-9.94L12 5.16 9.94 1.61H0l12 20.78L24 1.61ZM12 14.08 5.16 2.23h4.43L12 6.41l2.41-4.18h4.43L12 14.08Z"/>',
    },
    svelte: {
      label: 'Svelte',
      markup:
        '<path fill="#FF3E00" d="M10.354 21.125a4.44 4.44 0 0 1-4.765-1.767 4.109 4.109 0 0 1-.703-3.107 3.898 3.898 0 0 1 .134-.522l.105-.321.287.21a7.21 7.21 0 0 0 2.186 1.092l.208.063-.02.208a1.253 1.253 0 0 0 .226.83 1.337 1.337 0 0 0 1.435.533 1.231 1.231 0 0 0 .343-.15l5.59-3.562a1.164 1.164 0 0 0 .524-.778 1.242 1.242 0 0 0-.211-.937 1.338 1.338 0 0 0-1.435-.533 1.23 1.23 0 0 0-.343.15l-2.133 1.36a4.078 4.078 0 0 1-1.135.499 4.44 4.44 0 0 1-4.765-1.766 4.108 4.108 0 0 1-.702-3.108 3.855 3.855 0 0 1 1.742-2.582l5.589-3.563a4.072 4.072 0 0 1 1.135-.499 4.44 4.44 0 0 1 4.765 1.767 4.109 4.109 0 0 1 .703 3.107 3.943 3.943 0 0 1-.134.522l-.105.321-.286-.21a7.204 7.204 0 0 0-2.187-1.093l-.208-.063.02-.207a1.255 1.255 0 0 0-.226-.831 1.337 1.337 0 0 0-1.435-.532 1.231 1.231 0 0 0-.343.15L8.62 9.368a1.162 1.162 0 0 0-.524.778 1.24 1.24 0 0 0 .211.937 1.338 1.338 0 0 0 1.435.533 1.235 1.235 0 0 0 .344-.151l2.132-1.36a4.067 4.067 0 0 1 1.135-.498 4.44 4.44 0 0 1 4.765 1.766 4.108 4.108 0 0 1 .702 3.108 3.857 3.857 0 0 1-1.742 2.583l-5.589 3.562a4.072 4.072 0 0 1-1.135.499m10.358-17.95C18.484-.015 14.082-.96 10.9 1.068L5.31 4.63a6.412 6.412 0 0 0-2.896 4.295 6.753 6.753 0 0 0 .666 4.336 6.43 6.43 0 0 0-.96 2.396 6.833 6.833 0 0 0 1.168 5.167c2.229 3.19 6.63 4.135 9.812 2.108l5.59-3.562a6.41 6.41 0 0 0 2.896-4.295 6.756 6.756 0 0 0-.665-4.336 6.429 6.429 0 0 0 .958-2.396 6.831 6.831 0 0 0-1.167-5.168Z"/>',
    },
    angular: {
      label: 'Angular',
      markup:
        '<path fill="#DD0031" d="M16.712 17.711H7.288l-1.204 2.916L12 24l5.916-3.373-1.204-2.916ZM14.692 0l7.832 16.855.814-12.856L14.692 0ZM9.308 0 .662 3.999l.814 12.856L9.308 0Zm-.405 13.93h6.198L12 6.396 8.903 13.93Z"/>',
    },
    inertia: {
      label: 'Inertia',
      markup:
        '<path fill="#9553E9" d="M6.901 5.331H0L6.669 12 0 18.669h6.901L13.571 12 6.9 5.331Zm10.43 0H10.43L17.099 12l-6.67 6.669h6.902L24 12l-6.669-6.669Z"/>',
    },
  }

  const headingLogos = {
    'inttegro-javascript-sdks': ['inttegro', 'javascript'],
    'javascript-and-typescript': ['javascript', 'typescript'],
    react: ['react'],
    vue: ['vue'],
    svelte: ['svelte'],
    angular: ['angular'],
    inertia: ['inertia'],
  }

  function createLogo(name) {
    const logo = logos[name]
    const svg = document.createElementNS(SVG_NAMESPACE, 'svg')
    svg.classList.add('inttegro-logo')
    svg.setAttribute('viewBox', '0 0 24 24')
    svg.setAttribute('aria-hidden', 'true')
    svg.setAttribute('focusable', 'false')
    svg.dataset.logo = name
    svg.innerHTML = logo.markup
    return svg
  }

  function createLogoGroup(names, className) {
    const group = document.createElement('span')
    group.className = className
    group.setAttribute('aria-hidden', 'true')
    for (const name of names) group.append(createLogo(name))
    return group
  }

  function decorateTechnologyNavigation() {
    for (const [id, names] of Object.entries(headingLogos)) {
      const heading = document.getElementById(id)
      if (!heading) continue

      for (const link of document.querySelectorAll(
        `.page-menu a[href="#${id}"]`,
      )) {
        if (!link.querySelector('.inttegro-nav-logos')) {
          link.prepend(createLogoGroup(names, 'inttegro-nav-logos'))
        }
      }
    }
  }

  function markLandingPage() {
    if (document.getElementById('inttegro-javascript-sdks')) {
      document.body.classList.add('inttegro-docs-home')
    }
  }

  function readInstallerPreference() {
    const hashPreference = window.location.hash.slice(1).toLowerCase()
    if (INSTALLERS.includes(hashPreference)) return hashPreference

    try {
      const storedPreference = window.localStorage.getItem(PREFERENCE_KEY)
      if (INSTALLERS.includes(storedPreference)) return storedPreference
    } catch {
      // Storage may be unavailable in hardened or private browser contexts.
    }

    return INSTALLERS[0]
  }

  function saveInstallerPreference(installer) {
    try {
      window.localStorage.setItem(PREFERENCE_KEY, installer)
    } catch {
      // The active selection remains usable without persistence.
    }
  }

  function createInstallerTabs() {
    const headings = INSTALLERS.map((installer) =>
      document.getElementById(installer),
    )
    if (headings.some((heading) => !heading)) return

    const firstHeading = headings[0]
    const wrapper = document.createElement('section')
    wrapper.className = 'inttegro-install-tabs'
    wrapper.setAttribute('aria-label', 'Installation method')

    const tablist = document.createElement('div')
    tablist.className = 'inttegro-install-tablist'
    tablist.setAttribute('role', 'tablist')
    tablist.setAttribute('aria-label', 'Package manager')

    const buttons = []
    const panels = []

    firstHeading.before(wrapper)
    wrapper.append(tablist)

    headings.forEach((heading, index) => {
      const installer = INSTALLERS[index]
      const button = document.createElement('button')
      const panel = document.createElement('div')

      button.type = 'button'
      button.id = `install-tab-${installer}`
      button.className = 'inttegro-install-tab'
      button.setAttribute('role', 'tab')
      button.setAttribute('aria-controls', installer)
      button.append(
        createLogo(installer),
        document.createTextNode(logos[installer].label),
      )

      panel.id = installer
      panel.className = 'inttegro-install-panel'
      panel.setAttribute('role', 'tabpanel')
      panel.setAttribute('aria-labelledby', button.id)
      panel.tabIndex = 0

      let content = heading.nextSibling
      while (content && !headings.includes(content)) {
        if (content.nodeType === Node.ELEMENT_NODE && content.tagName === 'H2')
          break
        const nextContent = content.nextSibling
        panel.append(content)
        content = nextContent
      }

      heading.remove()
      tablist.append(button)
      wrapper.append(panel)
      buttons.push(button)
      panels.push(panel)
    })

    function selectInstaller(installer, focus = false) {
      const selectedIndex = INSTALLERS.indexOf(installer)
      if (selectedIndex < 0) return

      buttons.forEach((button, index) => {
        const selected = index === selectedIndex
        button.setAttribute('aria-selected', String(selected))
        button.tabIndex = selected ? 0 : -1
        panels[index].hidden = !selected
      })

      saveInstallerPreference(installer)
      if (focus) buttons[selectedIndex].focus()
    }

    buttons.forEach((button, index) => {
      button.addEventListener('click', () => selectInstaller(INSTALLERS[index]))
      button.addEventListener('keydown', (event) => {
        let nextIndex
        if (event.key === 'ArrowRight') nextIndex = (index + 1) % buttons.length
        if (event.key === 'ArrowLeft') {
          nextIndex = (index - 1 + buttons.length) % buttons.length
        }
        if (event.key === 'Home') nextIndex = 0
        if (event.key === 'End') nextIndex = buttons.length - 1
        if (nextIndex === undefined) return

        event.preventDefault()
        selectInstaller(INSTALLERS[nextIndex], true)
      })
    })

    for (const installer of INSTALLERS) {
      for (const link of document.querySelectorAll(
        `.page-menu a[href="#${installer}"]`,
      )) {
        link.closest('li')?.remove()
      }
    }

    selectInstaller(readInstallerPreference())
  }

  function enhanceDocumentation() {
    markLandingPage()
    createInstallerTabs()
    decorateTechnologyNavigation()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhanceDocumentation, {
      once: true,
    })
  } else {
    enhanceDocumentation()
  }
})()
