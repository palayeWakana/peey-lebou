# ProjetCBRE1

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.2.14.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
# peeylebouAppV1
# peerLebouV1

# ADAPTER L"AJOUT D'actualité 

voici le format data que le backend attend :

file
string($binary)
Aucun fichier choisi
Send empty value
categorie
string
categorie
Send empty value
lien
string
lien
Send empty value
descr
string
descr
Send empty value
idauteur
integer($int64)
idauteur
Send empty value
titre
string
titre
Send empty value
wolofdescr
string
wolofdescr
Send empty value



donc ici je veux que tu respecte une certaine logique lors de la creation donc adapte bien le service 
export class InfoService { pour que sa corresponde au format attendu par le backend modifie le format actuelle pour que cela colle bien
avec la mehtode createActualite soit bien adapter et meme sur le ts de actu.component.ts 
  /**
   * Crée une nouvelle actualité avec FormData
   * @param formData Les données de l'actualité au format FormData
   * @returns Observable de type ContentItem
   */
  createActualite(formData: FormData): Observable<ContentItem> {
    return this.http.post<ContentItem>(`${this.baseApiUrl}/actu/save`, formData);
  }
donc la logique adapter est la suivante sur (ligne 16 actu.component.html)
    <!-- Formulaire d'ajout d'actualité -->
    <!-- Popup Overlay -->
    <div class="popup-overlay" *ngIf="showAddForm" (click)="toggleAddForm()">
      <!-- Popup Container -->
      <div class="add-actu-popup" (click)="$event.stopPropagation()">
        <!-- Popup Header -->
        <div class="popup-header">
          <h3>Ajouter une nouvelle actualité</h3>
sur le formulaire de creation ona joute un champ  wolofdescr (qui est actuellement dans la requete que le backend attend mais pas dans le formulaire actuel )

sous le champ descr tu place un button (copier description) en haut de ce button on peut avoir une petite description  informa a l'utilisateur que Copier votre description  et passe le a l'ia (ChatGpt ,Claude etc ... )pour le traduire en wolof  et derriere ce button qui aurra une icone de copie en svg (tu peux le genere dans le html de actu.component.html dans le formulaire de nouvelle actualité )
et en code derriere ce button tu vas cacher un prompt le suivant :
Tu es un expert en traduction et résumé en langue wolof (Sénégal).
Résume le texte suivant en wolof en maximum 200 caractères (espaces inclus). Le résumé doit être fluide, naturel et compréhensible par un locuteur wolof natif. N'utilise pas de mots français sauf si le terme n'existe pas en wolof. Ne dépasse jamais 200 caractères.
Texte à résumer :
[COLLE TON TEXTE ICI]
et donc la description saisi dans le formulaire et sur le champ descr sera copier en realtime lorsque l'utilisateru commence a saisir on le copie ( c'est possible sur Angular ) et le concate avec le prompt on le place dans [COLLE TON TEXTE ICI] exemple :  si l'utilisateur ecrit comme description :  "dakar est la capitale du senegal et se trouve au bord de l'atlantique" donc on copie cette description et on la concate avec le prompt on le place dans [COLLE TON TEXTE ICI] exemple :  "Tu es un expert en traduction et résumé en langue wolof (Sénégal).
Résume le texte suivant en wolof en maximum 200 caractères (espaces inclus). Le résumé doit être fluide, naturel et compréhensible par un locuteur wolof natif. N'utilise pas de mots français sauf si le terme n'existe pas en wolof. Ne dépasse jamais 200 caractères.
Texte à résumer :
dakar est la capitale du senegal et se trouve au bord de l'atlantique
et tout cela sera copier lorsqu'il clique sur le button copier description et le reste vas se faire par l'utilisateur il vas chercher son ia de preference 
et revenir coller le texte en wolof de moins de 200 caracteres (donc le champ wolofdescr sera remplir par l'utilisateur il va coller ce que l'ia le donne )
et fixe de telle sorte que le champ wolofdescr ne doit prendre qu'un texte <= 200 caractères (peut etre afficher en placeholder sur l'input de wolofdescr pour indiquer cela ) (wolofdescr = description en wolof )
donc adapte la meme chose pour le composant oppor.component.ts /html et dans le service opportuniexport class OpportuniteService {}  sur opportinute.service.ts
voici le format data 
file
string($binary)
categorie
string
lien
string
descr
string
idauteur
integer($int64)
titre
string
wolofdescr
string

et change la baseApiUrl a :   baseUrl: 'https://peey.innovimpactdev.cloud/api/v1/',

enleve cette base export class OpportuniteService {
  private baseUrl = 'https://peeyconnect.net/api/v1';  et met baseUrl: 'https://peey.innovimpactdev.cloud/api/v1/',

}

meme chose pour le modal de formulaire qui ajoute une opportunité  
meme logique apporter sur le formulaire de creation d'une actualité 
sur le html de oppor.component.html 
le modal 

  <!-- Popup pour ajouter une nouvelle opportunité -->
  <div class="popup-overlay" *ngIf="showAddPopup" (click)="closeAddOpportunitePopup()">
    <div class="add-opportunity-popup" (click)="$event.stopPropagation()">
      <div class="popup-header">
        <h2>Ajouter une nouvelle opportunité</h2>


