// // src/assets/config/landing.config.ts

// export interface INavbarConfig {
//   logo: {
//     src?: string;
//     svg?: string;
//     alt: string;
//     link: string;
//   };
//   breadcrumb: string[];
//   centerTitle: string;
//   centerSubtitle: string;
//   centerBadge?: string;
// }

// type RepoAction = false | {
//   label: string;
//   action: string;
// };

// export interface ISidebarNavConfig {
//   userContext: {
//     avatar: string;
//     username: string;
//   };
//   sections: Array<{
//     title: string;
//     items: Array<{
//       icon: string;
//       label: string;
//       link: string;
//       type?: string;
//       action?: RepoAction;
//     }>;
//   }>;
// }

// export interface IFeedItem {
//   id: string;
//   avatar: string;
//   action: string;
//   time: string;
//   repo: {
//     name: string;
//     link: string;
//     description: string;
//   };
//   stats: {
//     language?: {
//       name: string;
//       color: string;
//     };
//     stars?: number;
//   };
// }

// export interface IConfigPanelSection {
//   title: string;
//   icon?: string;
//   isCollapsed: boolean;
//   items: Array<{
//     icon: string;
//     title: string;
//     description: string;
//     link: string;
//   }>;
// }

// export interface ILandingConfig {
//   navbar: INavbarConfig;
//   sidebar: ISidebarNavConfig;
//   feeds: Array<{
//     id: string;
//     title: string;
//     items: IFeedItem[];
//   }>;
//   configPanel: IConfigPanelSection[];
// }
