import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { DataService } from './services/data.service';
import { ParserService } from './services/parser.service';
import { AppComponent } from './app.component';
import { ColorKeyComponent } from './color-key/color-key.component';
import { MapComponent } from './map/map.component';
import { TableComponent } from './table/table.component';
import { ConverterComponent } from './converter/converter.component';
import { ScatterplotComponent } from './scatterplot/scatterplot.component';
import { AnimateService } from './services/animate.service';
import { HashService } from './services/hash.service';
import { BlockRenderComponent } from './common/block-render.component';
import { StatFormComponent } from './converter/stat-form.component';
import { DataTabComponent } from './converter/data-tab.component';

@NgModule({
    declarations: [
        AppComponent,
        ColorKeyComponent,
        MapComponent,
        TableComponent,
        ConverterComponent,
        ScatterplotComponent,
        BlockRenderComponent,
        StatFormComponent,
        DataTabComponent
    ],
    imports: [
        BrowserModule,
        FormsModule,
        HttpClientModule
    ],
    providers: [
        DataService,
        ParserService,
        AnimateService,
        HashService
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
